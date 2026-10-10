import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockPrisma, mockEnrollLearner, mockAudit } = vi.hoisted(() => ({
  mockPrisma: {
    order: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
  mockEnrollLearner: vi.fn(),
  mockAudit: vi.fn(),
}));

vi.mock("../src/lib/prisma.js", () => ({ prisma: mockPrisma }));
vi.mock("../src/lib/enrollment-helpers.js", () => ({ enrollLearner: mockEnrollLearner }));
vi.mock("../src/lib/audit.js", () => ({ audit: mockAudit }));

import { fulfillPaidOrder, enrollFree } from "../src/lib/enrollment.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("fulfillPaidOrder — payment/enrollment integrity", () => {
  it("enrolls exactly once and records the payment on first fulfilment", async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: "o1", userId: "u1", courseId: "c1" });
    const tx = {
      order: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      payment: { findUnique: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({}) },
    };
    mockPrisma.$transaction.mockImplementation(async (cb: (t: unknown) => unknown) => cb(tx));
    mockEnrollLearner.mockResolvedValue("p1");

    const result = await fulfillPaidOrder("o1", { razorpayPaymentId: "pay1", signature: "sig" });

    expect(result.alreadyPaid).toBe(false);
    expect(mockEnrollLearner).toHaveBeenCalledExactlyOnceWith(tx, "c1", "u1");
    expect(tx.payment.create).toHaveBeenCalledOnce();
    expect(mockAudit).toHaveBeenCalled();
  });

  it("does NOT double-enroll when a duplicate webhook races in (single-flight gate)", async () => {
    mockPrisma.order.findUnique.mockResolvedValue({ id: "o1", userId: "u1", courseId: "c1" });
    const tx = {
      order: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) }, // already claimed
      payment: { findUnique: vi.fn().mockResolvedValue({ id: "pay1" }), create: vi.fn() },
    };
    mockPrisma.$transaction.mockImplementation(async (cb: (t: unknown) => unknown) => cb(tx));

    const result = await fulfillPaidOrder("o1", { razorpayPaymentId: "pay1", signature: "sig" });

    expect(result.alreadyPaid).toBe(true);
    expect(mockEnrollLearner).not.toHaveBeenCalled();
    expect(tx.payment.create).not.toHaveBeenCalled();
  });

  it("throws NOT_FOUND for an unknown order", async () => {
    mockPrisma.order.findUnique.mockResolvedValue(null);
    await expect(
      fulfillPaidOrder("missing", { razorpayPaymentId: "pay1", signature: "sig" }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("enrollFree", () => {
  it("refuses a duplicate enrollment with ALREADY_ENROLLED", async () => {
    const tx = {
      courseParticipant: { findUnique: vi.fn().mockResolvedValue({ id: "p1", status: "ACTIVE", mentorUserId: null }) },
    };
    mockPrisma.$transaction.mockImplementation(async (cb: (t: unknown) => unknown) => cb(tx));

    await expect(enrollFree("c1", "u1")).rejects.toMatchObject({ code: "ALREADY_ENROLLED" });
    expect(mockEnrollLearner).not.toHaveBeenCalled();
  });

  it("enrolls and returns the assigned mentor on success", async () => {
    const tx = {
      courseParticipant: {
        findUnique: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ mentorUserId: "m1" }),
      },
    };
    mockPrisma.$transaction.mockImplementation(async (cb: (t: unknown) => unknown) => cb(tx));
    mockEnrollLearner.mockResolvedValue("p1");

    const result = await enrollFree("c1", "u1");
    expect(result).toEqual({ participantId: "p1", mentorUserId: "m1" });
    expect(mockAudit).toHaveBeenCalledWith("u1", "course.enrolled_free", "course", "c1");
  });
});
