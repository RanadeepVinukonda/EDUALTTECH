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

const resourceSchema = z.object({
  label: z.string().trim().min(1).max(120),
  url: z.string().url().max(600),
});

const createChapterSchema = z.object({
  courseId: z.string().min(1).max(40),
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().max(600).optional(),
  meetingUrl: z.string().url().max(600).optional(),
  recordingUrl: z.string().url().max(600).optional(),
  resources: z.array(resourceSchema).max(30).optional(),
});

const updateChapterSchema = createChapterSchema.omit({ courseId: true }).partial();

/** Structure (roadmap shell, chapters) is admin/course-owner territory. Mentors fill content only. */
async function assertCourseOwner(courseId: string, user: AuthUser): Promise<void> {
  if (user.role === "ADMIN") return;
  const course = await prisma.course.findFirst({
    where: { id: courseId, teacherId: user.id },
    select: { id: true },
  });
  if (!course) throw ApiError.forbidden("Only the admin or the course owner can change the course structure");
}

/** A chapter belongs to the course, so its guard is the course owner (or an admin). */
async function assertChapterAccess(chapterId: string, user: AuthUser): Promise<{ courseId: string }> {
  const chapter = await prisma.courseChapter.findUnique({ where: { id: chapterId }, select: { courseId: true } });
  if (!chapter) throw ApiError.notFound("Chapter not found");
  await assertCourseOwner(chapter.courseId, user);
  return { courseId: chapter.courseId };
}

// ── Mentor: my mentoring rows + chapters ────────────────────────────

router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const mentorship = await prisma.courseMentor.findMany({
      where: req.user!.role === "ADMIN" ? {} : { mentorId: req.user!.id },
      include: {
        course: { select: { id: true, title: true, slug: true } },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: { mentorship } });
  } catch (err) {
    next(err);
  }
});

// ── The course roadmap: one structure, shared by every learner and mentor ──

router.get("/course/:courseId", requireAuth, async (req, res, next) => {
  try {
    const courseId = param(req, "courseId");
    const user = req.user!;

    if (user.role !== "ADMIN") {
      const [owns, mentors, enrolled] = await Promise.all([
        prisma.course.findFirst({ where: { id: courseId, teacherId: user.id }, select: { id: true } }),
        prisma.courseMentor.findFirst({ where: { courseId, mentorId: user.id }, select: { id: true } }),
        prisma.enrollment.findFirst({ where: { courseId, studentId: user.id, status: "ACTIVE" }, select: { id: true } }),
      ]);
      if (!owns && !mentors && !enrolled) throw ApiError.forbidden("Enroll to open the roadmap");
    }

    const chapters = await prisma.courseChapter.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      include: {
        modules: {
          where: { chapterId: { not: null } },
          orderBy: { position: "asc" },
          include: { lessons: { orderBy: { position: "asc" } } },
        },
      },
    });
    res.json({ success: true, data: { chapters } });
  } catch (err) {
    next(err);
  }
});

// ── Admin / course owner: create, update, delete chapters ────────────

const roadmapSchema = z.object({
  courseId: z.string().min(1).max(40),
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().max(1_000).optional(),
  meetingUrl: z.union([z.string().url(), z.literal("")]).optional(),
  recordingUrl: z.union([z.string().url(), z.literal("")]).optional(),
  resources: z.array(z.object({ label: z.string().trim().min(1).max(120), url: z.string().url() })).max(20).optional(),
});

// The roadmap is created before any chapter: title, intro, and the course-wide
// live link / recording / resources that sit above every chapter.
router.put("/roadmap", requireAuth, validate(roadmapSchema), async (req, res, next) => {
  try {
    const data = req.body as z.infer<typeof roadmapSchema>;
    await assertCourseOwner(data.courseId, req.user!);

    const roadmap = await prisma.course.update({
      where: { id: data.courseId },
      data: {
        roadmapTitle: data.title,
        ...(data.summary !== undefined ? { roadmapSummary: data.summary || null } : {}),
        ...(data.meetingUrl !== undefined ? { roadmapMeetingUrl: data.meetingUrl || null } : {}),
        ...(data.recordingUrl !== undefined ? { roadmapRecordingUrl: data.recordingUrl || null } : {}),
        ...(data.resources !== undefined ? { roadmapResources: data.resources } : {}),
      },
      select: {
        id: true,
        roadmapTitle: true,
        roadmapSummary: true,
        roadmapMeetingUrl: true,
        roadmapRecordingUrl: true,
        roadmapResources: true,
      },
    });

    res.json({ success: true, data: { roadmap } });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, validate(createChapterSchema), async (req, res, next) => {
  try {
    const data = req.body as z.infer<typeof createChapterSchema>;
    await assertCourseOwner(data.courseId, req.user!);

    const last = await prisma.courseChapter.findFirst({
      where: { courseId: data.courseId },
      orderBy: { order: "desc" },
      select: { order: true },
    });

    const chapter = await prisma.courseChapter.create({
      data: { ...data, order: (last?.order ?? 0) + 1 },
    });
    res.status(201).json({ success: true, data: { chapter } });
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", requireAuth, validate(updateChapterSchema), async (req, res, next) => {
  try {
    await assertChapterAccess(param(req, "id"), req.user!);
    const chapter = await prisma.courseChapter.update({
      where: { id: param(req, "id") },
      data: req.body as z.infer<typeof updateChapterSchema>,
    });
    res.json({ success: true, data: { chapter } });
  } catch (err) {
    next(err);
  }
});

const reorderSchema = z.object({ order: z.number().int().min(1).max(500) });

router.patch("/:id/order", requireAuth, validate(reorderSchema), async (req, res, next) => {
  try {
    const { courseId } = await assertChapterAccess(param(req, "id"), req.user!);
    const { order } = req.body as z.infer<typeof reorderSchema>;

    const clash = await prisma.courseChapter.findFirst({ where: { courseId, order } });
    if (clash) throw ApiError.conflict("Another chapter already uses that position");

    const chapter = await prisma.courseChapter.update({ where: { id: param(req, "id") }, data: { order } });
    res.json({ success: true, data: { chapter } });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    await assertChapterAccess(param(req, "id"), req.user!);
    await prisma.courseChapter.delete({ where: { id: param(req, "id") } });
    res.json({ success: true, data: { message: "Chapter deleted" } });
  } catch (err) {
    next(err);
  }
});

export default router;