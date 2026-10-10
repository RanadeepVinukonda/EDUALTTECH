import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate, body } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { audit } from "../../lib/audit.js";
import { getCourseAccess, assertCourseOwner } from "../../lib/course-access.js";

const router = Router();

const nextOrder = async (last: { order: number }[]) => last.reduce((m, r) => Math.max(m, r.order), 0) + 1;

// ── Read roadmap ───────────────────────────────────────────────────

router.get("/:courseId/roadmap", requireAuth, async (req, res) => {
  const access = await getCourseAccess(req.params.courseId, req.user!);
  if (!access.canRead) throw ApiError.forbidden("You are not part of this course");

  const chapters = await prisma.chapter.findMany({
    where: { courseId: req.params.courseId },
    orderBy: { order: "asc" },
    select: {
      id: true, title: true, summary: true, order: true,
      topics: {
        orderBy: { order: "asc" },
        select: {
          id: true, title: true, summary: true, order: true,
          lessons: {
            where: access.isStaff ? {} : { isPublished: true },
            orderBy: { order: "asc" },
            select: { id: true, title: true, type: true, contentUrl: true, textContent: true, order: true, isPublished: true, createdAt: true },
          },
        },
      },
    },
  });

  let completedLessonIds: string[] = [];
  if (access.isLearner) {
    const participant = await prisma.courseParticipant.findUnique({
      where: { courseId_userId: { courseId: req.params.courseId, userId: req.user!.id } },
      select: { id: true },
    });
    if (participant) {
      const rows = await prisma.lessonProgress.findMany({
        where: { participantId: participant.id, lesson: { courseId: req.params.courseId, isPublished: true } },
        select: { lessonId: true },
      });
      completedLessonIds = rows.map((r) => r.lessonId);
    }
  }

  res.json({ success: true, data: { chapters, completedLessonIds } });
});

// ── Chapters (course owner: admin/creator) ─────────────────────────

const chapterBody = z.object({
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().max(2000).nullable().optional(),
});

async function chapterCourse(chapterId: string) {
  const chapter = await prisma.chapter.findUnique({ where: { id: chapterId }, select: { id: true, courseId: true, title: true } });
  if (!chapter) throw ApiError.notFound("Chapter not found");
  return chapter;
}

router.post("/:courseId/chapters", requireAuth, validate({ body: chapterBody }), async (req, res) => {
  await assertCourseOwner(req.params.courseId, req.user!);
  const input = body<z.infer<typeof chapterBody>>(req);
  const last = await prisma.chapter.findMany({
    where: { courseId: req.params.courseId },
    select: { order: true },
    orderBy: { order: "desc" },
    take: 1,
  });
  const chapter = await prisma.chapter.create({
    data: { courseId: req.params.courseId, ...input, order: await nextOrder(last) },
  });
  audit(req.user!.id, "chapter.created", "chapter", chapter.id, { courseId: req.params.courseId });
  res.status(201).json({ success: true, data: { chapter } });
});

router.patch("/chapters/:id", requireAuth, validate({ body: chapterBody.partial() }), async (req, res) => {
  const chapter = await chapterCourse(req.params.id);
  await assertCourseOwner(chapter.courseId, req.user!);
  const updated = await prisma.chapter.update({ where: { id: chapter.id }, data: body<Record<string, unknown>>(req) as never });
  res.json({ success: true, data: { chapter: updated } });
});

router.delete("/chapters/:id", requireAuth, async (req, res) => {
  const chapter = await chapterCourse(req.params.id);
  await assertCourseOwner(chapter.courseId, req.user!);
  await prisma.chapter.delete({ where: { id: chapter.id } }); // topics+lessons cascade
  audit(req.user!.id, "chapter.deleted", "chapter", chapter.id, { courseId: chapter.courseId });
  res.json({ success: true, data: { ok: true } });
});

// ── Topics ─────────────────────────────────────────────────────────

const topicBody = z.object({
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().max(2000).nullable().optional(),
});

async function topicContext(topicId: string) {
  const topic = await prisma.topic.findUnique({ where: { id: topicId }, select: { id: true, courseId: true, chapterId: true } });
  if (!topic) throw ApiError.notFound("Topic not found");
  return topic;
}

router.post("/chapters/:chapterId/topics", requireAuth, validate({ body: topicBody }), async (req, res) => {
  const chapter = await chapterCourse(req.params.chapterId);
  await assertCourseOwner(chapter.courseId, req.user!);
  const input = body<z.infer<typeof topicBody>>(req);
  const last = await prisma.topic.findMany({
    where: { chapterId: chapter.id },
    select: { order: true },
    orderBy: { order: "desc" },
    take: 1,
  });
  const topic = await prisma.topic.create({
    data: { courseId: chapter.courseId, chapterId: chapter.id, ...input, order: await nextOrder(last) },
  });
  audit(req.user!.id, "topic.created", "topic", topic.id, { chapterId: chapter.id });
  res.status(201).json({ success: true, data: { topic } });
});

router.patch("/topics/:id", requireAuth, validate({ body: topicBody.partial() }), async (req, res) => {
  const topic = await topicContext(req.params.id);
  await assertCourseOwner(topic.courseId, req.user!);
  const updated = await prisma.topic.update({ where: { id: topic.id }, data: body<Record<string, unknown>>(req) as never });
  res.json({ success: true, data: { topic: updated } });
});

router.delete("/topics/:id", requireAuth, async (req, res) => {
  const topic = await topicContext(req.params.id);
  await assertCourseOwner(topic.courseId, req.user!);
  await prisma.topic.delete({ where: { id: topic.id } }); // lessons cascade
  audit(req.user!.id, "topic.deleted", "topic", topic.id, { courseId: topic.courseId });
  res.json({ success: true, data: { ok: true } });
});

// ── Lessons (staff: mentor authors, owner manages) ─────────────────

const lessonBody = z.object({
  title: z.string().trim().min(2).max(160),
  type: z.enum(["VIDEO", "READING"]).default("READING"),
  contentUrl: z.string().url().nullable().optional(),
  textContent: z.string().max(100_000).nullable().optional(),
  isPublished: z.boolean().optional(),
});

async function lessonContext(lessonId: string) {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true, courseId: true, topicId: true, title: true } });
  if (!lesson) throw ApiError.notFound("Lesson not found");
  return lesson;
}

router.post("/topics/:topicId/lessons", requireAuth, validate({ body: lessonBody }), async (req, res) => {
  const topic = await topicContext(req.params.topicId);
  const access = await getCourseAccess(topic.courseId, req.user!);
  if (!access.isStaff) throw ApiError.forbidden("Mentor or course-owner access required");

  const input = body<z.infer<typeof lessonBody>>(req);
  const last = await prisma.lesson.findMany({
    where: { topicId: topic.id },
    select: { order: true },
    orderBy: { order: "desc" },
    take: 1,
  });
  const lesson = await prisma.lesson.create({
    data: {
      courseId: topic.courseId,
      topicId: topic.id,
      ...input,
      order: await nextOrder(last),
      createdById: req.user!.id,
    },
  });
  audit(req.user!.id, "lesson.created", "lesson", lesson.id, { topicId: topic.id });
  res.status(201).json({ success: true, data: { lesson } });
});

router.patch("/lessons/:id", requireAuth, validate({ body: lessonBody.partial().extend({ order: z.number().int().min(1).optional() }) }), async (req, res) => {
  const lesson = await lessonContext(req.params.id);
  const access = await getCourseAccess(lesson.courseId, req.user!);
  if (!access.isStaff) throw ApiError.forbidden("Mentor or course-owner access required");
  const updated = await prisma.lesson.update({ where: { id: lesson.id }, data: body<Record<string, unknown>>(req) as never });
  res.json({ success: true, data: { lesson: updated } });
});

router.delete("/lessons/:id", requireAuth, async (req, res) => {
  const lesson = await lessonContext(req.params.id);
  const access = await getCourseAccess(lesson.courseId, req.user!);
  if (!access.isStaff) throw ApiError.forbidden("Mentor or course-owner access required");
  await prisma.lesson.delete({ where: { id: lesson.id } });
  audit(req.user!.id, "lesson.deleted", "lesson", lesson.id, { topicId: lesson.topicId });
  res.json({ success: true, data: { ok: true } });
});

// ── Reorder (two-phase to dodge unique-order constraints) ──────────

const reorderBody = z.object({ orderedIds: z.array(z.string().min(1)).min(1).max(200) });

router.post("/:courseId/chapters/reorder", requireAuth, validate({ body: reorderBody }), async (req, res) => {
  await assertCourseOwner(req.params.courseId, req.user!);
  const { orderedIds } = body<{ orderedIds: string[] }>(req);

  const owned = await prisma.chapter.findMany({ where: { courseId: req.params.courseId }, select: { id: true } });
  const ownedIds = new Set(owned.map((c) => c.id));
  if (orderedIds.length !== owned.length || orderedIds.some((id) => !ownedIds.has(id))) {
    throw ApiError.badRequest("orderedIds must contain exactly this course's chapters");
  }

  await prisma.$transaction([
    prisma.chapter.updateMany({ where: { courseId: req.params.courseId }, data: { order: -1 } }),
    ...orderedIds.map((id, i) => prisma.chapter.update({ where: { id }, data: { order: i + 1 } })),
  ]);
  res.json({ success: true, data: { ok: true } });
});

router.post("/chapters/:id/topics/reorder", requireAuth, validate({ body: reorderBody }), async (req, res) => {
  const chapter = await chapterCourse(req.params.id);
  await assertCourseOwner(chapter.courseId, req.user!);
  const { orderedIds } = body<{ orderedIds: string[] }>(req);

  const owned = await prisma.topic.findMany({ where: { chapterId: chapter.id }, select: { id: true } });
  const ownedIds = new Set(owned.map((t) => t.id));
  if (orderedIds.length !== owned.length || orderedIds.some((id) => !ownedIds.has(id))) {
    throw ApiError.badRequest("orderedIds must contain exactly this chapter's topics");
  }

  await prisma.$transaction([
    prisma.topic.updateMany({ where: { chapterId: chapter.id }, data: { order: -1 } }),
    ...orderedIds.map((id, i) => prisma.topic.update({ where: { id }, data: { order: i + 1 } })),
  ]);
  res.json({ success: true, data: { ok: true } });
});

router.post("/topics/:id/lessons/reorder", requireAuth, validate({ body: reorderBody }), async (req, res) => {
  const topic = await topicContext(req.params.id);
  const access = await getCourseAccess(topic.courseId, req.user!);
  if (!access.isStaff) throw ApiError.forbidden("Mentor or course-owner access required");
  const { orderedIds } = body<{ orderedIds: string[] }>(req);

  const owned = await prisma.lesson.findMany({ where: { topicId: topic.id }, select: { id: true } });
  const ownedIds = new Set(owned.map((l) => l.id));
  if (orderedIds.length !== owned.length || orderedIds.some((id) => !ownedIds.has(id))) {
    throw ApiError.badRequest("orderedIds must contain exactly this topic's lessons");
  }

  await prisma.$transaction([
    prisma.lesson.updateMany({ where: { topicId: topic.id }, data: { order: -1 } }),
    ...orderedIds.map((id, i) => prisma.lesson.update({ where: { id }, data: { order: i + 1 } })),
  ]);
  res.json({ success: true, data: { ok: true } });
});

export default router;
