import type { Prisma } from "@prisma/client";
import { ApiError } from "../utils/ApiError.js";

type Tx = Prisma.TransactionClient;

/**
 * A user is either a seeker or a provider for a given course, never both.
 * The exclusion lives in checks below — and callers wrap them in a
 * transaction that first locks the USER row, so concurrent enroll /
 * approve / assign paths serialize instead of racing past each other.
 */
export async function lockUser(tx: Tx, userId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
}

/** Throws if the user already teaches or mentors this course. */
export async function assertNotProvider(tx: Tx, userId: string, courseId: string): Promise<void> {
  const [owns, mentors] = await Promise.all([
    tx.course.findFirst({ where: { id: courseId, teacherId: userId }, select: { id: true } }),
    tx.courseMentor.findFirst({ where: { courseId, mentorId: userId }, select: { id: true } }),
  ]);
  if (owns || mentors) {
    throw ApiError.conflict("You teach or mentor this course — you can't also be a student in it");
  }
}

/** Throws if the user has an ACTIVE enrollment in this course. */
export async function assertNotSeeking(tx: Tx, userId: string, courseId: string): Promise<void> {
  const seeking = await tx.enrollment.findFirst({
    where: { courseId, studentId: userId, status: "ACTIVE" },
    select: { id: true },
  });
  if (seeking) {
    throw ApiError.conflict(
      "That user is actively learning this course — drop the enrollment before giving them a mentor role",
    );
  }
}

/** Locks a mentor seat row so concurrent enrollments can't oversell capacity. */
export async function lockMentorSeat(tx: Tx, courseMentorId: string): Promise<void> {
  await tx.$queryRaw`SELECT id FROM "CourseMentor" WHERE id = ${courseMentorId} FOR UPDATE`;
}
