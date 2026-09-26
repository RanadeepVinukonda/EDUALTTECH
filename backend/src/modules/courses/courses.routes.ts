import { Router } from "express";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { param } from "../../utils/params.js";
import { config } from "../../config/env.js";
import { uploadFile, publicFileUrl, storageKey } from "../../lib/storage.js";
import { enrollmentConfirmationEmail } from "../../lib/email.js";
import { logger } from "../../utils/logger.js";

const router = Router();

router.get("/", async (req, res, next) => {
  try {
    const q = z
      .object({
        subject: z.string().optional(),
        search: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(12),
      })
      .parse(req.query);

    const where = {
      isPublished: true,
      ...(q.subject ? { subject: q.subject } : {}),
      ...(q.search
        ? { OR: [{ title: { contains: q.search, mode: "insensitive" as const } }, { description: { contains: q.search, mode: "insensitive" as const } }] }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.course.findMany({
        where,
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          subject: true,
          gradeLevel: true,
          teacher: { select: { name: true } },
          _count: { select: { enrollments: true, modules: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      prisma.course.count({ where }),
    ]);

    res.json({ success: true, data: { items, total, page: q.page, limit: q.limit } });
  } catch (err) {
    next(err);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({
      where: { slug: param(req, "slug") },
      include: {
        teacher: { select: { id: true, name: true } },
        mentors: {
          include: {
            mentor: { select: { id: true, name: true, avatarUrl: true, bio: true, education: true } },
            chapters: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                summary: true,
                order: true,
                meetingUrl: true,
                recordingUrl: true,
                resources: true,
              },
            },
            _count: { select: { enrollments: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        modules: {
          orderBy: { position: "asc" },
          include: {
            lessons: {
              where: { isPublished: true },
              orderBy: { position: "asc" },
              select: { id: true, title: true, type: true, position: true },
            },
          },
        },
        _count: { select: { enrollments: true } },
      },
    });
    if (!course) throw ApiError.notFound("Course not found");
    res.json({ success: true, data: { course } });
  } catch (err) {
    next(err);
  }
});

// ── Teacher endpoints ───────────────────────────────────────────────

const courseSchema = z.object({
  title: z.string().min(3).max(140),
  description: z.string().min(10),
  subject: z.string().min(2).max(60),
  gradeLevel: z.string().max(40).optional(),
  // Form sends thumbnailUrl as "" when the admin leaves the picker empty —
  // coercion to undefined so an empty field never trips .url() validation.
  thumbnailUrl: z.preprocess(
    (v) => (v === "" || v === undefined ? undefined : v),
    z.string().url().optional(),
  ),
  isPublished: z.boolean().optional(),
});

router.post("/",   requireAuth, requireRole("ADMIN"), validate(courseSchema), async (req, res, next) => {
    try {
    const base = req.body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    let slug = base;
    let i = 2;
    while (await prisma.course.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }

    const course = await prisma.course.create({
      data: { ...req.body, slug, teacherId: req.user!.id },
    });
    res.status(201).json({ success: true, data: { course } });
  } catch (err) {
    next(err);
  }
});

// ── Thumbnail upload ─────────────────────────────────────────────────
// Same raw-body → Supabase Storage pipeline as resources, so admins can
// drop a real image instead of pasting a URL. Limits enforced before any
// byte is read, and only admins may write.

router.post("/thumbnail", requireAuth, requireRole("ADMIN"), async (req, res, next) => {
  const mimeType = (req.headers["x-thumbnail-mime"] ?? "image/jpeg").toString();
  if (!mimeType.startsWith("image/")) throw ApiError.badRequest("Thumbnail must be an image");
  const maxBytes = config.limits.maxUploadBytes;
  const length = Number(req.headers["content-length"] ?? 0);
  if (!Number.isFinite(length) || length <= 0) throw ApiError.badRequest("Missing Content-Length");
  if (length > maxBytes) {
    throw ApiError.badRequest(`Thumbnail too large — max ${Math.round(maxBytes / 1024 / 1024)} MB`);
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const body = Buffer.concat(chunks);
  if (body.byteLength !== length) throw ApiError.badRequest("Body size does not match Content-Length");

  const ext = mimeType.split("/")[1] ?? "jpeg";
  const path = `${req.user!.id}/${randomUUID()}.${ext}`;
  await uploadFile(config.supabase.storageBucket, path, body, mimeType);
  res.status(201).json({ success: true, data: { thumbnailUrl: publicFileUrl(config.supabase.storageBucket, path) } });
});

router.patch("/:id", requireAuth, async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: param(req, "id") } });
    if (!course) throw ApiError.notFound("Course not found");
    if (req.user!.role !== "ADMIN" && course.teacherId !== req.user!.id) {
      throw ApiError.forbidden("You can only edit your own courses");
    }
    const data = courseSchema.partial().parse(req.body);
    const updated = await prisma.course.update({ where: { id: course.id }, data });
    res.json({ success: true, data: { course: updated } });
  } catch (err) {
    next(err);
  }
});

// ── Enrollment (students) ───────────────────────────────────────────

const enrollSchema = z.object({ courseMentorId: z.string().min(1).max(40).optional() });

router.post("/:id/enroll", requireAuth, validate(enrollSchema), async (req, res, next) => {
  try {
    const courseId = param(req, "id");
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { mentors: { select: { id: true } } },
    });
    if (!course || !course.isPublished) throw ApiError.notFound("Course not found");

    const { courseMentorId } = req.body as z.infer<typeof enrollSchema>;
    if (course.mentors.length > 0) {
      if (!courseMentorId) throw ApiError.badRequest("Choose a mentor before enrolling");
      if (!course.mentors.some((m) => m.id === courseMentorId)) {
        throw ApiError.badRequest("That mentor does not teach this course");
      }
    }

    const enrolled = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: req.user!.id, courseId } },
    });
    if (!enrolled) {
      // Paid platform: enrolling requires an active plan (TRIAL or FULL).
      const active = await prisma.subscription.count({
        where: { userId: req.user!.id, isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      });
      if (active === 0) {
        throw ApiError.paymentRequired("You need an active plan to enroll — pick Trial (₹1) or Full (₹499)");
      }
    }

    const enrollment = await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: req.user!.id, courseId } },
      update: { status: "ACTIVE", ...(courseMentorId ? { courseMentorId } : {}) },
      create: { studentId: req.user!.id, courseId, courseMentorId: courseMentorId ?? null },
    });

    await prisma.activityLog.upsert({
      where: { userId_day_kind: { userId: req.user!.id, day: new Date(), kind: "enroll" } },
      update: { count: { increment: 1 } },
      create: { userId: req.user!.id, day: new Date(), kind: "enroll" },
    });

    void (async () => {
      try {
        const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { email: true, name: true } });
        if (user) await enrollmentConfirmationEmail(user.email, user.name, course.title);
      } catch (err) {
        logger.warn("Enrollment email failed", { error: err });
      }
    })();

    res.status(201).json({ success: true, data: { enrollment } });
  } catch (err) {
    next(err);
  }
});

router.post("/lessons/:lessonId/complete", requireAuth, async (req, res, next) => {
  try {
    const lessonId = param(req, "lessonId");
    const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } });
    if (!lesson) throw ApiError.notFound("Lesson not found");

    const enrollment = await prisma.enrollment.findUnique({
      where: { studentId_courseId: { studentId: req.user!.id, courseId: lesson.courseId } },
    });
    if (!enrollment) throw ApiError.forbidden("You are not enrolled in this course");

    await prisma.lessonProgress.upsert({
      where: { enrollmentId_lessonId: { enrollmentId: enrollment.id, lessonId } },
      update: {},
      create: { enrollmentId: enrollment.id, lessonId },
    });

    const [completed, totalLessons] = await Promise.all([
      prisma.lessonProgress.count({ where: { enrollmentId: enrollment.id } }),
      prisma.lesson.count({ where: { courseId: lesson.courseId, isPublished: true } }),
    ]);
    const progressPct = totalLessons === 0 ? 0 : Math.round((completed / totalLessons) * 100);

    await prisma.enrollment.update({
      where: { id: enrollment.id },
      data: { progressPct, status: progressPct >= 100 ? "COMPLETED" : "ACTIVE", completedAt: progressPct >= 100 ? new Date() : null },
    });

    await prisma.activityLog.upsert({
      where: { userId_day_kind: { userId: req.user!.id, day: new Date(), kind: "lesson" } },
      update: { count: { increment: 1 } },
      create: { userId: req.user!.id, day: new Date(), kind: "lesson" },
    });

    res.json({ success: true, data: { progressPct } });
  } catch (err) {
    next(err);
  }
});

export default router;
