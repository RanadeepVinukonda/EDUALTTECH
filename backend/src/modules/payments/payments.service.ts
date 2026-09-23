import crypto from "node:crypto";
import type { Order, Payment, Prisma } from "@prisma/client";
import { config } from "../../config/env.js";
import { getRazorpay, verifyPaymentSignature } from "../../lib/razorpay.js";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { logger } from "../../utils/logger.js";

// Plans are defined once and validated against the ledger everywhere.
export const PLANS = {
  TRIAL: { amountPaise: 1_00, label: "First-Class Trial (₹1)" },
  FULL: { amountPaise: 49_900, label: "Full Plan (₹499)" },
} as const;

export type PlanType = keyof typeof PLANS;

export interface VerifyPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface CreateOrderResult {
  order: Order;
  razorpayKeyId: string;
  reused: boolean;
}

export interface VerifyResult {
  order: Order;
  payment: Payment;
  alreadyPaid: boolean;
}

function hasActiveSubscription(userId: string, plan: PlanType): Promise<number> {
  const now = new Date();
  return prisma.subscription.count({
    where: { userId, plan, isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
  });
}

/**
 * Create a Razorpay order. Idempotency: the same `idempotencyKey`
 * for the same user always returns the existing order — never a
 * duplicate charge. No Order row is written unless Razorpay accepted
 * the order, so a failed upstream call leaves no partial state.
 */
export async function createOrder(userId: string, plan: PlanType, idempotencyKey: string): Promise<CreateOrderResult> {
  const existing = await prisma.order.findUnique({ where: { idempotencyKey } });
  if (existing) {
    if (existing.userId !== userId) throw ApiError.forbidden("Idempotency key already in use");
    return { order: existing, razorpayKeyId: config.razorpay.keyId, reused: true };
  }

  if ((await hasActiveSubscription(userId, plan)) > 0) {
    throw ApiError.conflict(`You are already on the ${plan} plan — no new order needed`);
  }

  const razorpay = getRazorpay();
  const rpOrder = await razorpay.orders.create({
    amount: PLANS[plan].amountPaise,
    currency: "INR",
    receipt: `eat_${userId.slice(-8)}_${Date.now()}`,
    notes: { userId, plan },
  });

  const order = await prisma.order.create({
    data: {
      userId,
      razorpayOrderId: rpOrder.id,
      amountPaise: PLANS[plan].amountPaise,
      plan,
      status: "CREATED",
      idempotencyKey,
    },
  });

  return { order, razorpayKeyId: config.razorpay.keyId, reused: false };
}

/**
 * Verify a checkout-handler payment. ACID + idempotent:
 *  - signature must verify,
 *  - the order transitions CREATED→PAID exactly once (conditional updateMany —
 *    a racing webhook cannot double-activate),
 *  - a subscription is created only when this call performs the transition,
 *  - retries after a dropped response return the ledger truth with alreadyPaid=true.
 */
export async function verifyPayment(userId: string, v: VerifyPayload): Promise<VerifyResult> {
  const order = await prisma.order.findUnique({ where: { razorpayOrderId: v.razorpay_order_id } });
  if (!order) throw ApiError.notFound("Order not found on ledger");
  if (order.userId !== userId) throw ApiError.forbidden("This order belongs to another user");
  if (!verifyPaymentSignature(v.razorpay_order_id, v.razorpay_payment_id, v.razorpay_signature)) {
    throw ApiError.badRequest("Payment signature verification failed");
  }

  if (order.status === "PAID") {
    const payment = await prisma.payment.upsert({
      where: { razorpayPaymentId: v.razorpay_payment_id },
      update: { verified: true, signature: v.razorpay_signature },
      create: {
        orderId: order.id,
        razorpayPaymentId: v.razorpay_payment_id,
        signature: v.razorpay_signature,
        verified: true,
      },
    });
    return { order, payment, alreadyPaid: true };
  }

  const result = await prisma.$transaction(async (tx) => {
    const transition = await tx.order.updateMany({
      where: { id: order.id, userId, status: "CREATED" },
      data: { status: "PAID" },
    });

    if (transition.count === 0) {
      // A webhook already activated the order — adopt it idempotently.
      const current = await tx.order.findUnique({ where: { id: order.id } });
      const payment = await tx.payment.upsert({
        where: { razorpayPaymentId: v.razorpay_payment_id },
        update: { verified: true },
        create: {
          orderId: order.id,
          razorpayPaymentId: v.razorpay_payment_id,
          signature: v.razorpay_signature,
          verified: true,
        },
      });
      return { order: current!, payment, alreadyPaid: true };
    }

    const payment = await tx.payment.create({
      data: {
        orderId: order.id,
        razorpayPaymentId: v.razorpay_payment_id,
        signature: v.razorpay_signature,
        verified: true,
      },
    });
    await tx.subscription.create({
      data: { userId, plan: order.plan, orderRef: order.orderNumber },
    });
    return { order: { ...order, status: "PAID" as const }, payment, alreadyPaid: false };
  });

  return result;
}

interface RazorpayWebhookPayload {
  event: string;
  payload?: {
    order?: { entity?: { id?: string; order_id?: string } };
    payment?: { entity?: { id?: string; order_id?: string } };
  };
}

export interface WebhookResult {
  processed: boolean;
  duplicate: boolean;
  skipped?: string;
}

/**
 * Process a Razorpay webhook. Append-only ledger + ACID activation:
 *  - every event is stored once (unique eventId) and never mutated,
 *  - fulfillment (order transition + subscription) and the processed
 *    flag flip in a single transaction,
 *  - the CREATED→PAID updateMany guard makes it impossible for a
 *    replay or a concurrent event to create a second subscription.
 */
export async function handleWebhook(rawBody: string, signature: string): Promise<WebhookResult> {
  if (!config.razorpay.webhookSecret) {
    throw ApiError.internal("RAZORPAY_WEBHOOK_SECRET is not configured");
  }

  const event = JSON.parse(rawBody) as RazorpayWebhookPayload;
  const rpEntity = event.payload?.order?.entity ?? event.payload?.payment?.entity;
  const eventId = `${event.event}:${rpEntity?.id ?? crypto.randomUUID()}`;

  const stored = await prisma.webhookEvent.upsert({
    where: { eventId },
    update: {},
    create: { eventId, eventType: event.event, signature, payload: event as unknown as Prisma.InputJsonValue, processed: false },
  });
  if (stored.processed) return { processed: true, duplicate: true };

  if (event.event !== "payment.captured" && event.event !== "order.paid") {
    await prisma.webhookEvent.update({ where: { eventId }, data: { processed: true, processedAt: new Date() } });
    return { processed: true, duplicate: false };
  }

  const paymentEntity = event.payload?.payment?.entity as { id?: string; order_id?: string } | undefined;
  const rpOrderId = paymentEntity?.order_id ?? rpEntity?.id;

  await prisma.$transaction(async (tx) => {
    if (rpOrderId) {
      const target = await tx.order.findUnique({ where: { razorpayOrderId: rpOrderId } });
      if (target && target.status === "CREATED") {
        const transition = await tx.order.updateMany({
          where: { id: target.id, status: "CREATED" },
          data: { status: "PAID" },
        });
        if (transition.count === 1) {
          await tx.subscription.create({
            data: { userId: target.userId, plan: target.plan, orderRef: target.orderNumber },
          });
        }
        if (paymentEntity?.id) {
          await tx.payment.upsert({
            where: { razorpayPaymentId: paymentEntity.id },
            update: { verified: true },
            create: {
              orderId: target.id,
              razorpayPaymentId: paymentEntity.id,
              signature,
              verified: true,
            },
          });
        }
      } else if (!target) {
        logger.warn("Webhook referenced an unknown Razorpay order", { rpOrderId, event: event.event });
      }
    }

    await tx.webhookEvent.update({ where: { eventId }, data: { processed: true, processedAt: new Date() } });
  });

  return { processed: true, duplicate: false };
}