import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate, body } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { audit } from "../../lib/audit.js";
import { getCourseAccess } from "../../lib/course-access.js";

const router = Router();

const meetingBody = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).nullable().optional(),
  scheduledAt: z.coerce.date(),
  durationMin: z.number().int().min(15).max(480).default(60),
  meetingUrl: z.string().url(),
  chapterId: z.string().nullable().optional(),
  topicId: z.string().nullable().optional(),
});

// List for course members (staff sees all; learners see future by default).
// Mounted at /api → served as /api/courses/:courseId/meetings.
router.get("/courses/:courseId/meetings", requireAuth, validate({ query: z.object({
  scope: z.enum(["upcoming", "past", "all"]).default("upcoming"),
}) }), async (req, res) => {
  const access = await getCourseAccess(req.params.courseId, req.user!);
  if (!access.canRead) throw ApiError.forbidden("You are not part of this course");
  const { scope } = req.query as unknown as { scope: "upcoming" | "past" | "all" };

  const now = new Date();
  const scheduledAt =
    scope === "upcoming" ? { gte: now } :
    scope === "past" ? { lt: now } :
    undefined;

  const meetings = await prisma.liveMeeting.findMany({
    where: { courseId: req.params.courseId, ...(scheduledAt ? { scheduledAt } : {}) },
    orderBy: { scheduledAt: scope === "past" ? "desc" : "asc" },
    include: {
      createdBy: { select: { firstName: true, lastName: true, avatarUrl: true } },
      chapter: { select: { id: true, title: true } },
      topic: { select: { id: true, title: true } },
    },
  });
  res.json({ success: true, data: { meetings } });
});

async function meetingCourse(meetingId: string) {
  const meeting = await prisma.liveMeeting.findUnique({ where: { id: meetingId }, select: { id: true, courseId: true, title: true } });
  if (!meeting) throw ApiError.notFound("Meeting not found");
  return meeting;
}

router.post("/courses/:courseId/meetings", requireAuth, validate({ body: meetingBody }), async (req, res) => {
  const access = await getCourseAccess(req.params.courseId, req.user!);
  if (!access.isStaff) throw ApiError.forbidden("Mentor or course-owner access required");
  const input = body<z.infer<typeof meetingBody>>(req);

  const meeting = await prisma.liveMeeting.create({
    data: { courseId: req.params.courseId, ...input, createdById: req.user!.id },
  });

  // Notify every active learner in the course.
  const learners = await prisma.courseParticipant.findMany({
    where: { courseId: req.params.courseId, role: "LEARNER", status: "ACTIVE" },
    select: { userId: true },
  });
  if (learners.length > 0) {
    await prisma.notification.createMany({
      data: learners.map((l) => ({
        recipientId: l.userId,
        title: "New live session scheduled",
        body: `${meeting.title} — ${new Date(meeting.scheduledAt).toLocaleString()}`,
        courseId: meeting.courseId,
      })),
    });
  }

  audit(req.user!.id, "meeting.created", "liveMeeting", meeting.id, { courseId: req.params.courseId });
  res.status(201).json({ success: true, data: { meeting } });
});

router.patch("/meetings/:id", requireAuth, validate({ body: meetingBody.partial() }), async (req, res) => {
  const meeting = await meetingCourse(req.params.id);
  const access = await getCourseAccess(meeting.courseId, req.user!);
  if (!access.isStaff) throw ApiError.forbidden("Mentor or course-owner access required");
  const updated = await prisma.liveMeeting.update({ where: { id: meeting.id }, data: body<Record<string, unknown>>(req) as never });
  res.json({ success: true, data: { meeting: updated } });
});

router.delete("/meetings/:id", requireAuth, async (req, res) => {
  const meeting = await meetingCourse(req.params.id);
  const access = await getCourseAccess(meeting.courseId, req.user!);
  if (!access.isStaff) throw ApiError.forbidden("Mentor or course-owner access required");
  await prisma.liveMeeting.delete({ where: { id: meeting.id } });
  audit(req.user!.id, "meeting.deleted", "liveMeeting", meeting.id, { courseId: meeting.courseId });
  res.json({ success: true, data: { ok: true } });
});

export default router;
