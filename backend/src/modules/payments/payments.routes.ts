import { Router, raw } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { config } from "../../config/env.js";
import { razorpay, razorpayConfigured, verifyCheckoutSignature, verifyHmac } from "../../lib/razorpay.js";
import { fulfillPaidOrder } from "../../lib/enrollment.js";
import { requireAuth, requireRole, requireVerifiedMobile } from "../../middlewares/auth.js";
import { validate, body } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { audit } from "../../lib/audit.js";

const router = Router();

// Webhook needs the exact raw bytes for HMAC — mounted before json parsing upstream.
router.use("/webhook", raw({ type: "*/*", limit: "1mb" }));

const orderInclude = {
  course: { select: { id: true, slug: true, title: true, thumbnailUrl: true } },
  user: { select: { id: true, firstName: true, lastName: true, email: true, mobile: true } },
  payments: { orderBy: { createdAt: "desc" as const }, take: 1 },
} as const;

// ── Create checkout order (mobile-verified) ────────────────────────

router.post(
  "/orders",
  requireAuth,
  requireVerifiedMobile,
  validate({
    body: z.object({
      courseId: z.string().min(1),
      idempotencyKey: z.string().min(8).max(120).optional(),
    }),
  }),
  async (req, res) => {
    if (!razorpayConfigured()) throw ApiError.badRequest("Payments are not configured yet");

    const { courseId, idempotencyKey } = body<{ courseId: string; idempotencyKey?: string }>(req);
    const userId = req.user!.id;

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course || course.status !== "PUBLISHED") throw ApiError.notFound("Course not found");
    if (course.pricePaise <= 0) throw ApiError.badRequest("This course is free — just enroll", "FREE_COURSE");

    const enrolled = await prisma.courseParticipant.findUnique({
      where: { courseId_userId: { courseId, userId } },
      select: { id: true },
    });
    if (enrolled) throw ApiError.conflict("You are already enrolled in this course", "ALREADY_ENROLLED");

    // Same checkout resumed (page refresh / double click) → return the same order.
    if (idempotencyKey) {
      const existing = await prisma.order.findUnique({ where: { idempotencyKey }, include: orderInclude });
      if (existing) {
        return res.json({ success: true, data: checkoutPayload(existing) });
      }
    }

    // DB row first (pending razorpay id), then the provider call — a crash in
    // between leaves a resumable CREATED order, never a provider orphans-to-DB gap.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true, email: true, mobile: true },
    });
    if (!user) throw ApiError.unauthorized();

    const order = await prisma.order.create({
      data: {
        userId,
        courseId,
        amountPaise: course.pricePaise, // immutable snapshot
        currency: course.currency,
        idempotencyKey: idempotencyKey ?? null,
        razorpayOrderId: `pending_${randomUUID()}`,
      },
      include: orderInclude,
    });

    const rzp = await razorpay().orders.create({
      amount: order.amountPaise,
      currency: order.currency,
      receipt: order.orderNumber.slice(0, 40),
      notes: { dbOrderId: order.id, courseId, userId },
    });

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { razorpayOrderId: rzp.id },
      include: orderInclude,
    });

    audit(userId, "order.created", "order", order.id, { courseId, amountPaise: order.amountPaise });
    res.status(201).json({ success: true, data: checkoutPayload(updated) });
  },
);

function checkoutPayload(order: {
  id: string; orderNumber: string; razorpayOrderId: string; amountPaise: number;
  currency: string; status: string; course: { id: string; slug: string; title: string; thumbnailUrl: string | null };
  user?: { firstName: string; lastName: string; email: string; mobile: string | null };
}) {
  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    razorpayOrderId: order.razorpayOrderId,
    amountPaise: order.amountPaise,
    currency: order.currency,
    status: order.status,
    keyId: config.razorpay.keyId,
    course: order.course,
    prefill: order.user
      ? {
          name: `${order.user.firstName} ${order.user.lastName}`.trim(),
          email: order.user.email,
          contact: order.user.mobile ?? "",
        }
      : undefined,
  };
}

// ── Checkout verify (signature from the browser) ───────────────────

router.post(
  "/verify",
  requireAuth,
  validate({
    body: z.object({
      razorpay_order_id: z.string().min(1),
      razorpay_payment_id: z.string().min(1),
      razorpay_signature: z.string().min(1),
    }),
  }),
  async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body<{
      razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string;
    }>(req);

    const order = await prisma.order.findUnique({ where: { razorpayOrderId: razorpay_order_id } });
    if (!order) throw ApiError.notFound("Order not found");
    if (order.userId !== req.user!.id) throw ApiError.forbidden("This order belongs to another account");

    const valid = verifyCheckoutSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });
    if (!valid) {
      audit(req.user!.id, "order.verify_failed", "order", order.id);
      throw ApiError.badRequest("Payment signature verification failed", "SIGNATURE_MISMATCH");
    }

    const result = await fulfillPaidOrder(order.id, {
      razorpayPaymentId: razorpay_payment_id,
      signature: razorpay_signature,
      method: "checkout",
    });

    const participant = await prisma.courseParticipant.findUnique({
      where: { courseId_userId: { courseId: order.courseId, userId: order.userId } },
      select: { mentorUserId: true },
    });

    res.json({ success: true, data: { ok: true, alreadyPaid: result.alreadyPaid, mentorUserId: participant?.mentorUserId ?? null } });
  },
);

// ── Provider webhook (HMAC over raw body, idempotent by event id) ──

router.post("/webhook", async (req, res) => {
  const signature = req.headers["x-razorpay-signature"];
  const rawBody = (req as unknown as { rawBody?: Buffer }).rawBody ?? (Buffer.isBuffer(req.body) ? req.body : undefined);
  if (typeof signature !== "string" || !rawBody) throw ApiError.unauthorized("Missing signature");

  const ok = verifyHmac(rawBody.toString("utf8"), signature, config.razorpay.webhookSecret || config.razorpay.keySecret || "");
  if (!ok) throw ApiError.unauthorized("Invalid webhook signature");

  const event = JSON.parse(rawBody.toString("utf8")) as {
    id: string; event: string;
    payload?: { payment?: { entity?: { id?: string; order_id?: string; method?: string; error?: unknown } } };
  };

  // Store-once: second delivery of the same event id short-circuits below.
  const record = await prisma.webhookEvent.upsert({
    where: { eventId: event.id },
    update: {},
    create: { eventId: event.id, eventType: event.event, signature, payload: event as never },
  });
  if (record.processed) return res.json({ success: true, data: { ok: true, duplicate: true } });

  const entity = event.payload?.payment?.entity;
  if (event.event === "payment.captured" && entity?.order_id && entity.id) {
    const order = await prisma.order.findUnique({ where: { razorpayOrderId: entity.order_id } });
    if (order) {
      const result = await fulfillPaidOrder(order.id, {
        razorpayPaymentId: entity.id,
        signature,
        method: entity.method ?? "webhook",
        rawPayload: event,
      });
      await prisma.webhookEvent.update({
        where: { id: record.id },
        data: { processed: true, processedAt: new Date() },
      });
      return res.json({ success: true, data: { ok: true, alreadyPaid: result.alreadyPaid } });
    }
  }

  // Unknown/unsupported event — mark handled so retries stay quiet.
  await prisma.webhookEvent.update({
    where: { id: record.id },
    data: { processed: true, processedAt: new Date() },
  });
  res.json({ success: true, data: { ok: true, ignored: true } });
});

// ── Reads ──────────────────────────────────────────────────────────

router.get("/my-orders", requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    include: orderInclude,
  });
  res.json({ success: true, data: { orders } });
});

router.get("/orders", requireAuth, requireRole("ADMIN"), validate({ query: z.object({
  status: z.enum(["CREATED", "PAID", "FAILED", "REFUNDED"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}) }), async (req, res) => {
  const { status, page, limit } = req.query as unknown as { status?: string; page: number; limit: number };
  const where = status ? { status: status as never } : {};
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit, include: orderInclude }),
  ]);
  res.json({ success: true, data: { orders, total, page, limit, hasMore: page * limit < total } });
});

router.get("/webhook-events", requireAuth, requireRole("ADMIN"), async (_req, res) => {
  const events = await prisma.webhookEvent.findMany({ orderBy: { receivedAt: "desc" }, take: 50 });
  res.json({ success: true, data: { events } });
});

export default router;
