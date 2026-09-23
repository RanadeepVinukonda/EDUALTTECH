import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { verifyWebhookSignature } from "../../lib/razorpay.js";
import { createOrder, handleWebhook, verifyPayment } from "./payments.service.js";
import { logger } from "../../utils/logger.js";

export function createOrderSchema() {
  return z.object({
    plan: z.enum(["TRIAL", "FULL"]),
    idempotencyKey: z.string().min(8).max(80),
  });
}

export const verifySchema = z.object({
  razorpay_order_id: z.string().min(4),
  razorpay_payment_id: z.string().min(4),
  razorpay_signature: z.string().min(8),
});

async function createOrderBody(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { plan, idempotencyKey } = createOrderSchema().parse(req.body);
    const { order, razorpayKeyId, reused } = await createOrder(req.user!.id, plan, idempotencyKey);
    res.status(reused ? 200 : 201).json({ success: true, data: { order, razorpayKeyId, reused } });
  } catch (err) {
    next(err);
  }
}

async function verifyBody(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await verifyPayment(req.user!.id, verifySchema.parse(req.body));
    res.json({ success: true, data: { order: result.order, paymentId: result.payment.id, alreadyPaid: result.alreadyPaid } });
  } catch (err) {
    next(err);
  }
}

async function webhook(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const signature = String(req.headers["x-razorpay-signature"] ?? "");
    if (!signature) throw ApiError.unauthorized("Missing webhook signature");
    const rawBody = Buffer.isBuffer(req.body) ? (req.body as Buffer).toString("utf8") : String(req.body);
    if (!verifyWebhookSignature(rawBody, signature)) {
      logger.warn("Rejected Razorpay webhook with invalid signature");
      throw ApiError.unauthorized("Invalid webhook signature");
    }
    const result = await handleWebhook(rawBody, signature);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function listOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = z
      .object({
        status: z.enum(["CREATED", "PAID", "FAILED", "REFUNDED"]).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(50),
      })
      .parse(req.query);

    const where = { ...(q.status ? { status: q.status } : {}) };
    const [items, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ success: true, data: { items, total, page: q.page, limit: q.limit } });
  } catch (err) {
    next(err);
  }
}

async function listWebhookEvents(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const events = await prisma.webhookEvent.findMany({
      orderBy: { receivedAt: "desc" },
      take: 100,
      select: { id: true, eventId: true, eventType: true, processed: true, receivedAt: true },
    });
    res.json({ success: true, data: { events } });
  } catch (err) {
    next(err);
  }
}

async function myOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json({ success: true, data: { orders } });
  } catch (err) {
    next(err);
  }
}

export const paymentsController = {
  createOrder: createOrderBody,
  verify: verifyBody,
  webhook,
  listOrders,
  listWebhookEvents,
  myOrders,
};