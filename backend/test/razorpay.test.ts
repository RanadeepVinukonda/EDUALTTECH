import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { verifyHmac, verifyCheckoutSignature } from "../src/lib/razorpay.js";

const SECRET = "rzp_test_secret";

describe("verifyHmac — webhook signature (constant-time)", () => {
  it("accepts a correctly signed raw body", () => {
    const body = JSON.stringify({ event: "payment.captured", id: "evt_1" });
    const signature = createHmac("sha256", "whsec").update(body).digest("hex");
    expect(verifyHmac(body, signature, "whsec")).toBe(true);
  });

  it("rejects a tampered body", () => {
    const signature = createHmac("sha256", "whsec").update(JSON.stringify({ amount: 100 })).digest("hex");
    expect(verifyHmac(JSON.stringify({ amount: 999999 }), signature, "whsec")).toBe(false);
  });

  it("rejects a wrong secret and a length mismatch without throwing", () => {
    const body = "{}";
    const signature = createHmac("sha256", "whsec").update(body).digest("hex");
    expect(verifyHmac(body, signature, "other")).toBe(false);
    expect(verifyHmac(body, "short", "whsec")).toBe(false);
  });
});

describe("verifyCheckoutSignature — client callback cannot be forged", () => {
  it("accepts the signature Razorpay would produce for order|payment", () => {
    const orderId = "order_abc";
    const paymentId = "pay_xyz";
    const signature = createHmac("sha256", SECRET).update(`${orderId}|${paymentId}`).digest("hex");
    expect(verifyCheckoutSignature({ orderId, paymentId, signature })).toBe(true);
  });

  it("rejects a forged/garbage signature", () => {
    expect(
      verifyCheckoutSignature({ orderId: "order_abc", paymentId: "pay_xyz", signature: "deadbeef" }),
    ).toBe(false);
  });

  it("rejects a signature computed over different ids", () => {
    const signature = createHmac("sha256", SECRET).update("order_abc|pay_OTHER").digest("hex");
    expect(
      verifyCheckoutSignature({ orderId: "order_abc", paymentId: "pay_xyz", signature }),
    ).toBe(false);
  });
});
