import type { Prisma } from "@prisma/client";
import { mentorCapacityDefault } from "./settings.js";

type Tx = Prisma.TransactionClient;

/** Row-locks the caller — serializes concurrent enroll/apply/approve on one user. */
export async function lockUser(tx: Tx, userId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
}

/** Row-locks a mentor participant row so seats cannot be oversold. */
export async function lockParticipant(tx: Tx, participantId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "CourseParticipant" WHERE id = ${participantId} FOR UPDATE`;
}

/**
 * Deterministic mentor seat selection under lock: the ACTIVE mentor with the
 * most free seats (null capacity → platform `mentor_capacity`). Returns null
 * when no mentor has room — caller stores mentorUserId = null, admin sees it.
 */
export async function pickMentorSeat(tx: Tx, courseId: string): Promise<string | null> {
  const defaultCap = await mentorCapacityDefault();
  const mentors = await tx.courseParticipant.findMany({
    where: { courseId, role: "MENTOR", status: "ACTIVE" },
    select: { id: true, userId: true, capacity: true },
  });
  if (mentors.length === 0) return null;

  let best: { userId: string; free: number } | null = null;
  for (const m of mentors) {
    await lockParticipant(tx, m.id);
    const cap = m.capacity ?? defaultCap;
    const assigned = await tx.courseParticipant.count({
      where: { courseId, role: "LEARNER", status: "ACTIVE", mentorUserId: m.userId },
    });
    const free = cap - assigned;
    if (free > 0 && (!best || free > best.free)) best = { userId: m.userId, free };
  }
  return best?.userId ?? null;
}
