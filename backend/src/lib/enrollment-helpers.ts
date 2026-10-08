import type { Prisma } from "@prisma/client";
import { lockUser, pickMentorSeat } from "./participants.js";

type Tx = Prisma.TransactionClient;

/**
 * Creates the LEARNER participant inside an open transaction.
 * Idempotent: an existing row (any status) returns its id — the caller decides
 * whether that is an error. Never trusts a client-supplied mentor: the seat is
 * picked under row locks, so concurrent purchases cannot oversell capacity.
 */
export async function enrollLearner(tx: Tx, courseId: string, userId: string): Promise<string> {
  await lockUser(tx, userId);

  const existing = await tx.courseParticipant.findUnique({
    where: { courseId_userId: { courseId, userId } },
    select: { id: true },
  });
  if (existing) return existing.id;

  const mentorUserId = await pickMentorSeat(tx, courseId);

  const participant = await tx.courseParticipant.create({
    data: { courseId, userId, role: "LEARNER", mentorUserId, status: "ACTIVE" },
  });

  // Private chat thread with the assigned mentor, when one had a seat.
  if (mentorUserId) {
    await tx.conversation.upsert({
      where: { courseId_learnerUserId: { courseId, learnerUserId: userId } },
      update: { mentorUserId },
      create: { courseId, learnerUserId: userId, mentorUserId },
    });
  }

  return participant.id;
}
