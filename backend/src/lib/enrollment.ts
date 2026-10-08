import { prisma } from "./prisma.js";
import { enrollLearner } from "./enrollment-helpers.js";
import { audit } from "./audit.js";
import { ApiError } from "../utils/ApiError.js";

export interface PaymentRecord {
  razorpayPaymentId: string;
  signature: string;
  method?: string;
  rawPayload?: unknown;
}

/**
 * Payment fulfilment: Order CREATED→PAID + payment row + enrollment, all in
 * ONE transaction. The conditional update (status CREATED only) is the
 * single-flight gate — webhook + checkout-verify racing together results in
 * exactly one enrollment, and the loser sees alreadyPaid=true.
 */
export async function fulfillPaidOrder(orderId: string, payment: PaymentRecord): Promise<{ alreadyPaid: boolean }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { id: true, userId: true, courseId: true },
  });
  if (!order) throw ApiError.notFound("Order not found");

  const result = await prisma.$transaction(async (tx) => {
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: "CREATED" },
      data: { status: "PAID" },
    });

    const paymentExists = await tx.payment.findUnique({
      where: { razorpayPaymentId: payment.razorpayPaymentId },
      select: { id: true },
    });
    if (!paymentExists) {
      await tx.payment.create({
        data: {
          orderId,
          razorpayPaymentId: payment.razorpayPaymentId,
          signature: payment.signature,
          method: payment.method,
          verified: true,
          rawPayload: payment.rawPayload as never,
        },
      });
    }

    if (claimed.count === 0) return { alreadyPaid: true };

    await enrollLearner(tx, order.courseId, order.userId);
    return { alreadyPaid: false };
  });

  if (!result.alreadyPaid) audit(order.userId, "order.paid", "order", orderId, { courseId: order.courseId });
  return result;
}

/** Free course enrollment (no order). Throws when already enrolled. */
export async function enrollFree(courseId: string, userId: string): Promise<{ participantId: string; mentorUserId: string | null }> {
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.courseParticipant.findUnique({
      where: { courseId_userId: { courseId, userId } },
      select: { id: true, status: true, mentorUserId: true },
    });
    if (existing) throw ApiError.conflict("You are already enrolled in this course", "ALREADY_ENROLLED");

    const participantId = await enrollLearner(tx, courseId, userId);
    const row = await tx.courseParticipant.findUnique({ where: { id: participantId }, select: { mentorUserId: true } });
    return { participantId, mentorUserId: row?.mentorUserId ?? null };
  });

  audit(userId, "course.enrolled_free", "course", courseId);
  return result;
}
