import Razorpay from "razorpay";
import crypto from "node:crypto";
import { config } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

let client: Razorpay | null = null;

export function getRazorpay(): Razorpay {
  if (!config.razorpay.keyId || !config.razorpay.keySecret) {
    throw ApiError.internal("Razorpay is not configured (missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)");
  }
  client ??= new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
  });
  return client;
}

/** Verify the checkout-handler signature: HMAC_SHA256(order_id|payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const expected = crypto
    .createHmac("sha256", config.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return timingSafeEqual(expected, signature);
}

/** Verify the X-Razorpay-Signature header of a webhook: HMAC_SHA256(rawBody, webhook_secret). */
export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = crypto.createHmac("sha256", config.razorpay.webhookSecret).update(rawBody).digest("hex");
  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
