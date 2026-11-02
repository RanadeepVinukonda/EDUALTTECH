import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate, body } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { audit } from "../../lib/audit.js";
import { getCourseAccess } from "../../lib/course-access.js";
import { signedUrl, removePrivate, fileExt } from "../../lib/storage.js";
import { supabaseAdmin } from "../../lib/supabase.js";
import { config } from "../../config/env.js";
import { sendEmailBatch, layout, escapeHtml } from "../../lib/email.js";
import { formatDateTime } from "../../lib/time.js";

const router = Router();

/** Emails every active learner in the course (best-effort - never blocks the request). */
async function emailCourseLearners(courseId: string, subject: string, title: string, intro: string, ctaUrl: string) {
  const learners = await prisma.courseParticipant.findMany({
    where: { courseId, role: "LEARNER", status: "ACTIVE" },
    select: { user: { select: { email: true } } },
  });
  await sendEmailBatch(
    learners.map((l) => ({ to: l.user.email, subject, html: layout(title, intro, "Open course", ctaUrl) })),
  );
}

const meetingBody = z.object({
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(4000).nullable().optional(),
  scheduledAt: z.coerce.date(),
  durationMin: z.number().int().min(15).max(480).default(60),
  meetingUrl: z.string().url(),
  chapterId: z.string().nullable().optional(),
  topicId: z.string().nullable().optional(),
  lessonId: z.string().nullable().optional(),
});

/**
 * A meeting's chapter/topic/lesson must all belong to the meeting's course and
 * form a valid chain. Without this a mentor could attach a session to another
 * course's content (or leak that content's existence through the meeting feed).
 */
async function assertMeetingLinks(courseId: string, links: {
  chapterId?: string | null;
  topicId?: string | null;
  lessonId?: string | null;
}): Promise<void> {
  let chapterId = links.chapterId ?? null;

  if (links.topicId) {
    const topic = await prisma.topic.findUnique({
      where: { id: links.topicId },
      select: { courseId: true, chapterId: true },
    });
    if (!topic || topic.courseId !== courseId) {
      throw ApiError.badRequest("Topic does not belong to this course");
    }
    if (chapterId && topic.chapterId !== chapterId) {
      throw ApiError.badRequest("Topic does not belong to the selected chapter");
    }
    chapterId = chapterId ?? topic.chapterId;
  }

  if (links.lessonId) {
    const lesson = await prisma.lesson.findUnique({
      where: { id: links.lessonId },
      select: { courseId: true, topicId: true, topic: { select: { chapterId: true } } },
    });
    if (!lesson || lesson.courseId !== courseId) {
      throw ApiError.badRequest("Lesson does not belong to this course");
    }
    if (links.topicId && lesson.topicId !== links.topicId) {
      throw ApiError.badRequest("Lesson does not belong to the selected topic");
    }
    if (chapterId && lesson.topic.chapterId !== chapterId) {
      throw ApiError.badRequest("Lesson does not belong to the selected chapter");
    }
  }

  if (chapterId) {
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: { courseId: true },
    });
    if (!chapter || chapter.courseId !== courseId) {
      throw ApiError.badRequest("Chapter does not belong to this course");
    }
  }
}

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
      lesson: { select: { id: true, title: true } },
      course: { select: { id: true, slug: true, title: true } },
    },
  });
  res.json({
    success: true,
    data: { meetings: meetings.map(({ recordingPath, ...m }) => ({ ...m, hasRecording: Boolean(recordingPath) })) },
  });
});

async function meetingCourse(meetingId: string) {
  const meeting = await prisma.liveMeeting.findUnique({
    where: { id: meetingId },
    select: { id: true, courseId: true, title: true, chapterId: true, topicId: true, lessonId: true },
  });
  if (!meeting) throw ApiError.notFound("Meeting not found");
  return meeting;
}

router.post("/courses/:courseId/meetings", requireAuth, validate({ body: meetingBody }), async (req, res) => {
  const access = await getCourseAccess(req.params.courseId, req.user!);
  if (!access.isStaff) throw ApiError.forbidden("Mentor or course-owner access required");
  const input = body<z.infer<typeof meetingBody>>(req);
  await assertMeetingLinks(req.params.courseId, input);

  const meeting = await prisma.liveMeeting.create({
    data: { courseId: req.params.courseId, ...input, createdById: req.user!.id },
  });

  // Notify every active learner in the course (in-app + email).
  const learners = await prisma.courseParticipant.findMany({
    where: { courseId: req.params.courseId, role: "LEARNER", status: "ACTIVE" },
    select: { userId: true },
  });
  if (learners.length > 0) {
    await prisma.notification.createMany({
      data: learners.map((l) => ({
        recipientId: l.userId,
        title: "New live session scheduled",
        body: `${meeting.title} - ${formatDateTime(meeting.scheduledAt)}`,
        courseId: meeting.courseId,
      })),
    });
  }

  const course = await prisma.course.findUnique({ where: { id: req.params.courseId }, select: { slug: true, title: true } });
  if (course) {
    await emailCourseLearners(
      meeting.courseId,
      `New live session: ${meeting.title}`,
      "A live session is scheduled",
      `<strong>${escapeHtml(meeting.title)}</strong> in ${escapeHtml(course.title)} is scheduled for ${escapeHtml(formatDateTime(meeting.scheduledAt))}.`,
      `${config.appBaseUrl}/dashboard/courses/${course.slug}/meetings`,
    );
  }

  audit(req.user!.id, "meeting.created", "liveMeeting", meeting.id, { courseId: req.params.courseId });
  res.status(201).json({ success: true, data: { meeting } });
});

router.patch("/meetings/:id", requireAuth, validate({ body: meetingBody.partial() }), async (req, res) => {
  const meeting = await meetingCourse(req.params.id);
  const access = await getCourseAccess(meeting.courseId, req.user!);
  if (!access.isStaff) throw ApiError.forbidden("Mentor or course-owner access required");
  const patch = body<Partial<z.infer<typeof meetingBody>>>(req);
  await assertMeetingLinks(meeting.courseId, {
    chapterId: patch.chapterId !== undefined ? patch.chapterId : meeting.chapterId,
    topicId: patch.topicId !== undefined ? patch.topicId : meeting.topicId,
    lessonId: patch.lessonId !== undefined ? patch.lessonId : meeting.lessonId,
  });
  const updated = await prisma.liveMeeting.update({ where: { id: meeting.id }, data: patch as never });
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

// ── Meeting reminders (mentor → learner email) ─────────────────────

router.post("/meetings/:id/remind", requireAuth, async (req, res) => {
  const meeting = await prisma.liveMeeting.findUnique({
    where: { id: req.params.id },
    select: { id: true, courseId: true, title: true, scheduledAt: true },
  });
  if (!meeting) throw ApiError.notFound("Meeting not found");
  const access = await getCourseAccess(meeting.courseId, req.user!);
  if (!access.isStaff) throw ApiError.forbidden("Mentor or course-owner access required");

  const course = await prisma.course.findUnique({ where: { id: meeting.courseId }, select: { slug: true, title: true } });
  await emailCourseLearners(
    meeting.courseId,
    `Reminder: ${meeting.title}`,
    "Your live session is coming up",
    `<strong>${escapeHtml(meeting.title)}</strong>${course ? ` in ${escapeHtml(course.title)}` : ""} starts at ${escapeHtml(formatDateTime(meeting.scheduledAt))}.`,
    `${config.appBaseUrl}/dashboard/courses/${course?.slug ?? ""}/meetings`,
  );
  audit(req.user!.id, "meeting.reminder.sent", "liveMeeting", meeting.id, { courseId: meeting.courseId });
  res.json({ success: true, data: { ok: true } });
});

// ── Meeting recording (mentor upload → private bucket → signed playback) ──

const VIDEO_EXTS = new Set([".mp4", ".webm"]);

router.post("/meetings/:id/recording/sign", requireAuth, validate({ body: z.object({ name: z.string().min(1).max(200) }) }), async (req, res) => {
  const meeting = await meetingCourse(req.params.id);
  const access = await getCourseAccess(meeting.courseId, req.user!);
  if (!access.isStaff) throw ApiError.forbidden("Mentor or course-owner access required");
  const { name } = body<{ name: string }>(req);
  const ext = fileExt(name);
  if (!VIDEO_EXTS.has(ext)) throw ApiError.badRequest("Recording must be an .mp4 or .webm file");

  const path = `recordings/${meeting.id}/${randomUUID()}${ext}`;
  const { data, error } = await supabaseAdmin().storage.from(config.supabase.privateBucket).createSignedUploadUrl(path);
  if (error || !data) throw ApiError.badRequest("Could not start the upload");
  res.json({ success: true, data: { bucket: config.supabase.privateBucket, path, token: data.token } });
});

router.post("/meetings/:id/recording", requireAuth, validate({ body: z.object({ path: z.string().min(1).max(300) }) }), async (req, res) => {
  const meetingDoc = await meetingCourse(req.params.id);
  const access = await getCourseAccess(meetingDoc.courseId, req.user!);
  if (!access.isStaff) throw ApiError.forbidden("Mentor or course-owner access required");
  const { path } = body<{ path: string }>(req);
  if (!path.startsWith(`recordings/${meetingDoc.id}/`)) throw ApiError.badRequest("Invalid upload path");

  const existing = await prisma.liveMeeting.findUnique({ where: { id: meetingDoc.id }, select: { recordingPath: true } });
  if (existing?.recordingPath && existing.recordingPath !== path) await removePrivate(existing.recordingPath).catch(() => undefined);

  const meeting = await prisma.liveMeeting.update({ where: { id: meetingDoc.id }, data: { recordingPath: path } });
  audit(req.user!.id, "meeting.recording.uploaded", "liveMeeting", meeting.id, { courseId: meetingDoc.courseId });
  res.json({ success: true, data: { meeting: { ...meeting, hasRecording: true, recordingPath: undefined } } });
});

router.get("/meetings/:id/recording", requireAuth, async (req, res) => {
  const meeting = await prisma.liveMeeting.findUnique({
    where: { id: req.params.id },
    select: { id: true, courseId: true, recordingPath: true },
  });
  if (!meeting || !meeting.recordingPath) throw ApiError.notFound("No recording for this meeting");
  const access = await getCourseAccess(meeting.courseId, req.user!);
  if (!access.canRead) throw ApiError.forbidden("You are not part of this course");
  const url = await signedUrl(meeting.recordingPath, 3600);
  res.json({ success: true, data: { url } });
});

export default router;
