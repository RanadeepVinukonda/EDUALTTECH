import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { param } from "../../utils/params.js";
import type { Role } from "@prisma/client";

const router = Router();

type AuthUser = { id: string; role: Role };

/** Admins, course owners and mentors of the course may edit its content. */
async function assertContentAccess(courseId: string, user: AuthUser): Promise<void> {
  if (user.role === "ADMIN") return;
  const [owns, mentors] = await Promise.all([
    prisma.course.findFirst({ where: { id: courseId, teacherId: user.id }, select: { id: true } }),
    prisma.courseMentor.findFirst({ where: { courseId, mentorId: user.id }, select: { id: true } }),
  ]);
  if (!owns && !mentors) throw ApiError.forbidden("Only the course owner, mentors or admins can edit course content");
}

const moduleSchema = z.object({
  title: z.string().trim().min(2).max(160),
  position: z.number().int().min(1).max(500).optional(),
  resources: z
    .array(z.object({ label: z.string().trim().min(1).max(120), url: z.string().url() }))
    .max(20)
    .optional(),
});

// Learners only see lesson links (recording / meeting / notes) once they are
// actually in the course. The public course page deliberately returns titles only.
router.get("/:courseId/roadmap", requireAuth, async (req, res, next) => {
  try {
    const courseId = param(req, "courseId");
    const user = req.user!;

    const allowed = await (async () => {
      if (user.role === "ADMIN") return true;
      const [owns, mentors, enrolled] = await Promise.all([
        prisma.course.findFirst({ where: { id: courseId, teacherId: user.id }, select: { id: true } }),
        prisma.courseMentor.findFirst({ where: { courseId, mentorId: user.id }, select: { id: true } }),
        prisma.enrollment.findFirst({ where: { courseId, studentId: user.id, status: "ACTIVE" }, select: { id: true } }),
      ]);
      return !!owns || !!mentors || !!enrolled;
    })();
    if (!allowed) throw ApiError.forbidden("Enroll to open the roadmap");

    const mentors = await prisma.courseMentor.findMany({
      where: { courseId },
      select: {
        id: true,
        chapters: {
          orderBy: { order: "asc" },
          include: {
            modules: {
              orderBy: { position: "asc" },
              include: { lessons: { where: { isPublished: true }, orderBy: { position: "asc" } } },
            },
          },
        },
      },
    });

    const meetings = await prisma.liveMeeting.findMany({
      where: { courseId },
      orderBy: { scheduledAt: "asc" },
      select: { id: true, title: true, meetingUrl: true, scheduledAt: true, chapterId: true },
    });

    res.json({
      success: true,
      data: {
        mentors: mentors.map((m) => ({ id: m.id, chapters: m.chapters })),
        meetings: meetings.map((m) => ({ ...m, chapter: m.chapterId ? { id: m.chapterId } : null })),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.get("/:courseId/modules", requireAuth, async (req, res, next) => {
  try {
    await assertContentAccess(param(req, "courseId"), req.user!);
    const chapterId = (req.query.chapterId as string | undefined) ?? null;
    const modules = await prisma.module.findMany({
      where: { courseId: param(req, "courseId"), chapterId },
      orderBy: { position: "asc" },
      include: { lessons: { orderBy: { position: "asc" } } },
    });
    res.json({ success: true, data: { modules } });
  } catch (err) {
    next(err);
  }
});

router.post("/:courseId/modules", requireAuth, validate(moduleSchema), async (req, res, next) => {
  try {
    const courseId = param(req, "courseId");
    await assertContentAccess(courseId, req.user!);
    const chapterId = (req.headers["x-chapter-id"] as string | undefined) ?? null;
    if (chapterId) {
      const chapter = await prisma.courseChapter.findUnique({
        where: { id: chapterId },
        select: { courseMentor: { select: { courseId: true, mentorId: true } } },
      });
      if (!chapter || chapter.courseMentor.courseId !== courseId) {
        throw ApiError.badRequest("That chapter does not belong to this course");
      }
      // A mentor only manages their own roadmap — not their colleagues' chapters.
      if (req.user!.role !== "ADMIN" && chapter.courseMentor.mentorId !== req.user!.id) {
        throw ApiError.forbidden("You can only add concepts to your own chapters");
      }
    }
    const last = await prisma.module.findFirst({
      where: { courseId, chapterId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const module = await prisma.module.create({
      data: {
        courseId,
        chapterId,
        title: req.body.title,
        position: req.body.position ?? (last?.position ?? 0) + 1,
        ...(req.body.resources ? { resources: req.body.resources } : {}),
      },
    });
    res.status(201).json({ success: true, data: { module } });
  } catch (err) {
    next(err);
  }
});

const moduleUpdate = moduleSchema.partial();

router.patch("/modules/:id", requireAuth, validate(moduleUpdate), async (req, res, next) => {
  try {
    const module = await prisma.module.findUnique({ where: { id: param(req, "id") }, select: { id: true, courseId: true, chapterId: true } });
    if (!module) throw ApiError.notFound("Module not found");
    await assertContentAccess(module.courseId, req.user!);
    const positions = moduleUpdate.pick({ position: true }).safeParse(req.body);
    if (positions.success && positions.data.position !== undefined) {
      const clash = await prisma.module.findFirst({
        where: { courseId: module.courseId, chapterId: module.chapterId, position: positions.data.position, id: { not: module.id } },
        select: { id: true },
      });
      if (clash) throw ApiError.conflict("Another concept already uses that position");
    }
    const updated = await prisma.module.update({ where: { id: module.id }, data: req.body });
    res.json({ success: true, data: { module: updated } });
  } catch (err) {
    next(err);
  }
});

router.delete("/modules/:id", requireAuth, async (req, res, next) => {
  try {
    const module = await prisma.module.findUnique({ where: { id: param(req, "id") }, select: { id: true, courseId: true } });
    if (!module) throw ApiError.notFound("Module not found");
    await assertContentAccess(module.courseId, req.user!);
    await prisma.module.delete({ where: { id: module.id } });
    res.json({ success: true, data: { message: "Module deleted" } });
  } catch (err) {
    next(err);
  }
});

const lessonSchema = z.object({
  title: z.string().trim().min(2).max(200),
  type: z.enum(["VIDEO", "READING", "QUIZ", "ASSIGNMENT"]).default("READING"),
  contentUrl: z.union([z.string().url(), z.literal("")]).optional(),
  meetingUrl: z.union([z.string().url(), z.literal("")]).optional(),
  textContent: z.string().max(20_000).optional(),
  position: z.number().int().min(1).max(500).optional(),
  isPublished: z.boolean().optional(),
});

async function assertLessonAccess(lessonId: string, user: AuthUser): Promise<{ id: string; courseId: string; moduleId: string }> {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { id: true, courseId: true, moduleId: true } });
  if (!lesson) throw ApiError.notFound("Lesson not found");
  await assertContentAccess(lesson.courseId, user);
  return lesson;
}

router.post("/:courseId/lessons", requireAuth, validate(lessonSchema.omit({ position: true }).required({ title: true })), async (req, res, next) => {
  try {
    const courseId = param(req, "courseId");
    const moduleId = (req.headers["x-module-id"] ?? "").toString();
    if (!moduleId) throw ApiError.badRequest("x-module-id header is required");
    const module = await prisma.module.findUnique({ where: { id: moduleId }, select: { id: true, courseId: true } });
    if (!module || module.courseId !== courseId) throw ApiError.badRequest("Module does not belong to this course");
    await assertContentAccess(courseId, req.user!);
    const last = await prisma.lesson.findFirst({ where: { moduleId }, orderBy: { position: "desc" }, select: { position: true } });
    const lesson = await prisma.lesson.create({
      data: {
        moduleId,
        courseId,
        title: req.body.title,
        type: req.body.type,
        contentUrl: req.body.contentUrl || null,
        meetingUrl: req.body.meetingUrl || null,
        textContent: req.body.textContent,
        position: req.body.position ?? (last?.position ?? 0) + 1,
        isPublished: req.body.isPublished ?? true,
      },
    });
    res.status(201).json({ success: true, data: { lesson } });
  } catch (err) {
    next(err);
  }
});

router.patch("/lessons/:id", requireAuth, validate(lessonSchema.partial()), async (req, res, next) => {
  try {
    const lesson = await assertLessonAccess(param(req, "id"), req.user!);
    const positions = lessonSchema.pick({ position: true }).safeParse(req.body);
    if (positions.success && positions.data.position !== undefined) {
      const clash = await prisma.lesson.findFirst({
        where: { moduleId: lesson.id, position: positions.data.position, id: { not: lesson.id } },
        select: { id: true },
      });
      if (clash) throw ApiError.conflict("Another lesson already uses that position");
    }
    const updated = await prisma.lesson.update({
      where: { id: param(req, "id") },
      data: {
        ...req.body,
        contentUrl: req.body.contentUrl === undefined ? undefined : req.body.contentUrl || null,
        meetingUrl: req.body.meetingUrl === undefined ? undefined : req.body.meetingUrl || null,
      },
    });
    res.json({ success: true, data: { lesson } });
  } catch (err) {
    next(err);
  }
});

router.delete("/lessons/:id", requireAuth, async (req, res, next) => {
  try {
    await assertLessonAccess(param(req, "id"), req.user!);
    await prisma.lesson.delete({ where: { id: param(req, "id") } });
    res.json({ success: true, data: { message: "Lesson deleted" } });
  } catch (err) {
    next(err);
  }
});

export default router;