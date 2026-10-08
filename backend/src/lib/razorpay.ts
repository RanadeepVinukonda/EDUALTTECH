import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";
import { config } from "../config/env.js";

let client: Razorpay | null = null;

export function razorpay(): Razorpay {
  if (!config.razorpay.keyId || !config.razorpay.keySecret) {
    throw new Error("Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)");
  }
  client ??= new Razorpay({ key_id: config.razorpay.keyId, key_secret: config.razorpay.keySecret });
  return client;
}

export function razorpayConfigured(): boolean {
  return Boolean(config.razorpay.keyId && config.razorpay.keySecret);
}

/** HMAC-SHA256 signature check, constant-time. */
export function verifyHmac(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function verifyCheckoutSignature(opts: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!config.razorpay.keySecret) return false;
  const expected = createHmac("sha256", config.razorpay.keySecret)
    .update(`${opts.orderId}|${opts.paymentId}`)
    .digest("hex");
  if (expected.length !== opts.signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(opts.signature));
}
