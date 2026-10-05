import { prisma } from "./prisma.js";

/**
 * Push a course notification to everyone who should see it: the enrolled
 * students, the mentors and the course owner. Fire-and-forget — a failed
 * notification must never fail the write that triggered it.
 */
export function notifyCourse(input: {
  courseId: string;
  title: string;
  body: string;
  senderId?: string;
}): void {
  void prisma.notification
    .create({
      data: {
        courseId: input.courseId,
        title: input.title,
        body: input.body,
        scope: "COURSE",
        senderId: input.senderId,
      },
    })
    .catch(() => undefined);
}