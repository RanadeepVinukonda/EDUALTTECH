import type { Prisma } from "@prisma/client";
import { lockUser, lockParticipant, pickMentorSeat } from "./participants.js";
import { mentorCapacityDefault } from "./settings.js";

type Tx = Prisma.TransactionClient;

/**
 * Creates the LEARNER participant inside an open transaction.
 * Idempotent: an existing row (any status) returns its id — the caller decides
 * whether that is an error. A learner-chosen mentor is honoured only when that
 * mentor is an ACTIVE seat with room; otherwise the seat is auto-picked under
 * row locks, so a full/absent choice can never block a paid enrollment or
 * oversell capacity.
 */
export async function enrollLearner(
  tx: Tx,
  courseId: string,
  userId: string,
  preferredMentorUserId?: string | null,
): Promise<string> {
  await lockUser(tx, userId);

  const existing = await tx.courseParticipant.findUnique({
    where: { courseId_userId: { courseId, userId } },
    select: { id: true },
  });
  if (existing) return existing.id;

  const course = await tx.course.findUnique({ where: { id: courseId }, select: { title: true } });
  const mentorUserId = await resolveMentor(tx, courseId, preferredMentorUserId);

  const participant = await tx.courseParticipant.create({
    data: { courseId, userId, role: "LEARNER", mentorUserId, status: "ACTIVE" },
  });

  // Private chat thread with the assigned mentor, when one had a seat.
  if (mentorUserId) {
    await tx.conversation.upsert({
      where: { courseId_learnerUserId: { courseId, learnerUserId: userId } },
      update: {},
      create: { courseId, learnerUserId: userId, mentorUserId },
    });
  }

  await notifyEnrollment(tx, {
    courseId,
    courseTitle: course?.title ?? "your course",
    learnerUserId: userId,
    mentorUserId,
  });

  return participant.id;
}

/** Chosen mentor if it still has a free seat, else the deterministic auto-pick. */
async function resolveMentor(tx: Tx, courseId: string, preferredMentorUserId?: string | null): Promise<string | null> {
  if (!preferredMentorUserId) return pickMentorSeat(tx, courseId);

  const mentor = await tx.courseParticipant.findUnique({
    where: { courseId_userId: { courseId, userId: preferredMentorUserId } },
    select: { id: true, role: true, status: true, capacity: true },
  });
  if (!mentor || mentor.role !== "MENTOR" || mentor.status !== "ACTIVE") return pickMentorSeat(tx, courseId);

  await lockParticipant(tx, mentor.id);
  const cap = mentor.capacity ?? (await mentorCapacityDefault());
  const assigned = await tx.courseParticipant.count({
    where: { courseId, role: "LEARNER", status: "ACTIVE", mentorUserId: preferredMentorUserId },
  });
  return cap - assigned > 0 ? preferredMentorUserId : pickMentorSeat(tx, courseId);
}

/** In-transaction notifications for the learner (and mentor) on enrollment. */
async function notifyEnrollment(
  tx: Tx,
  args: { courseId: string; courseTitle: string; learnerUserId: string; mentorUserId: string | null },
): Promise<void> {
  const { courseId, courseTitle, learnerUserId, mentorUserId } = args;

  const [learner, mentor] = await Promise.all([
    tx.user.findUnique({ where: { id: learnerUserId }, select: { firstName: true, lastName: true } }),
    mentorUserId
      ? tx.user.findUnique({ where: { id: mentorUserId }, select: { firstName: true, lastName: true } })
      : Promise.resolve(null),
  ]);
  const learnerName = learner ? `${learner.firstName} ${learner.lastName}`.trim() : "A learner";
  const mentorName = mentor ? `${mentor.firstName} ${mentor.lastName}`.trim() : null;

  const rows: Prisma.NotificationCreateManyInput[] = [
    {
      recipientId: learnerUserId,
      title: "You're enrolled",
      body: mentorName
        ? `You're enrolled in ${courseTitle}. Your mentor is ${mentorName} — say hi in Messages.`
        : `You're enrolled in ${courseTitle}. A mentor will be assigned shortly.`,
      courseId,
    },
  ];
  if (mentorUserId) {
    rows.push({
      recipientId: mentorUserId,
      senderId: learnerUserId,
      title: "New learner enrolled",
      body: `${learnerName} enrolled in ${courseTitle}. Say hi in Messages to get them started.`,
      courseId,
    });
  }

  await tx.notification.createMany({ data: rows });
}
