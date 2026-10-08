import type { Role } from "@prisma/client";
import { prisma } from "./prisma.js";
import { ApiError } from "../utils/ApiError.js";

export interface CourseAccess {
  isAdmin: boolean;
  isCreator: boolean;
  isMentor: boolean;
  isLearner: boolean;
  /** admin | course creator | active mentor — may author/manage teaching content */
  isStaff: boolean;
  /** any relationship at all — may read course-owned data */
  canRead: boolean;
}

/**
 * Resolves the caller's relationship to a course. Never trusts client-supplied
 * membership — everything is derived from the authenticated user id.
 */
export async function getCourseAccess(courseId: string, user: { id: string; role: Role }): Promise<CourseAccess> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, createdById: true },
  });
  if (!course) throw ApiError.notFound("Course not found");

  const isAdmin = user.role === "ADMIN";
  const isCreator = course.createdById === user.id;
  let isMentor = false;
  let isLearner = false;

  if (!isAdmin && !isCreator) {
    const p = await prisma.courseParticipant.findUnique({
      where: { courseId_userId: { courseId, userId: user.id } },
      select: { role: true, status: true },
    });
    isMentor = p?.role === "MENTOR" && p.status === "ACTIVE";
    isLearner = p?.role === "LEARNER" && p.status === "ACTIVE";
  }

  const isStaff = isAdmin || isCreator || isMentor;
  return { isAdmin, isCreator, isMentor, isLearner, isStaff, canRead: isStaff || isLearner };
}

/** Course creator or platform admin only — structure, pricing, publishing. */
export async function assertCourseOwner(courseId: string, user: { id: string; role: Role }): Promise<void> {
  const access = await getCourseAccess(courseId, user);
  if (!access.isAdmin && !access.isCreator) throw ApiError.forbidden("Only the course admin can do that");
}

/** Any participant (or admin/creator) — reads course-owned resources. */
export async function assertCourseParticipant(courseId: string, user: { id: string; role: Role }): Promise<CourseAccess> {
  const access = await getCourseAccess(courseId, user);
  if (!access.canRead) throw ApiError.forbidden("You are not part of this course");
  return access;
}

/** Active mentor (or platform admin) — authors lessons/meetings/resources. */
export async function assertCourseMentor(courseId: string, user: { id: string; role: Role }): Promise<CourseAccess> {
  const access = await getCourseAccess(courseId, user);
  if (!access.isMentor && !access.isAdmin) throw ApiError.forbidden("Mentor access required for this course");
  return access;
}
