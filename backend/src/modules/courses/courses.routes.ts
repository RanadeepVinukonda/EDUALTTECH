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
          pricePaise: true,
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

// ── My courses — both sides of a user's life on the platform, in one call.
// seeking: courses I enrolled to learn. mentoring: courses I own or mentor.
router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const [seeking, mentoring] = await Promise.all([
      prisma.enrollment.findMany({
        where: { studentId: req.user!.id },
        orderBy: { enrolledAt: "desc" },
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              title: true,
              thumbnailUrl: true,
              subject: true,
              pricePaise: true,
            },
          },
          courseMentor: { select: { id: true, capacity: true, mentor: { select: { id: true, name: true, avatarUrl: true } } } },
        },
      }),
      req.user!.role === "ADMIN"
        ? prisma.courseMentor.findMany({ orderBy: { createdAt: "desc" }, include: { course: { select: { id: true, slug: true, title: true, thumbnailUrl: true, subject: true } } } })
        : prisma.courseMentor.findMany({
            where: { OR: [{ mentorId: req.user!.id }, { course: { teacherId: req.user!.id } }] },
            orderBy: { createdAt: "desc" },
            include: { course: { select: { id: true, slug: true, title: true, thumbnailUrl: true, subject: true } } },
          }),
    ]);

    res.json({ success: true, data: { seeking, mentoring } });
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
        resources: { where: { isPublished: true }, orderBy: { createdAt: "desc" } },
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

    const raw = course as typeof course & {
      mentors: (typeof course.mentors)[number] & { seatsLeft?: number };
    };
    // Derive live seat counts — capacity vs ACTIVE enrollments, not total.
    const mentorCounts = await prisma.enrollment.groupBy({
      by: ["courseMentorId"],
      where: { courseId: course.id, status: "ACTIVE", courseMentorId: { not: null } },
      _count: { _all: true },
    });
    const padded = new Map(mentorCounts.map((m) => [m.courseMentorId, m._count._all]));
    for (const m of raw.mentors) {
      const used = padded.get(m.id) ?? 0;
      (m as { seatsLeft?: number }).seatsLeft = Math.max(m.capacity - used, 0);
    }

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
  pricePaise: z.union([z.number().int().min(0), z.string().regex(/^\d*$/).transform((v) => (v === "" ? null : parseInt(v, 10)))]).nullable().optional(),
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
      include: { mentors: { select: { id: true, capacity: true } } },
    });
    if (!course || !course.isPublished) throw ApiError.notFound("Course not found");

    const { courseMentorId } = req.body as z.infer<typeof enrollSchema>;
    if (course.mentors.length > 0) {
      if (!courseMentorId) throw ApiError.badRequest("Choose a mentor with seats before enrolling");
      const chosen = course.mentors.find((m) => m.id === courseMentorId);
      if (!chosen) throw ApiError.badRequest("That mentor does not teach this course");

      // Mentor seats are per-ACTIVE-enrollment. If every mentor is full, the
      // student gets a readable reason instead of a dead-end 400.
      const counts = await prisma.enrollment.groupBy({
        by: ["courseMentorId"],
        where: { courseId, status: "ACTIVE", courseMentorId: { not: null } },
        _count: { _all: true },
      });
      const used = new Map(counts.map((c) => [c.courseMentorId, c._count._all]));
      const open = course.mentors
        .map((m) => ({ id: m.id, seatsLeft: Math.max(m.capacity - (used.get(m.id) ?? 0), 0) }))
        .filter((m) => m.seatsLeft > 0);

      if ((used.get(chosen.id) ?? 0) >= chosen.capacity) {
        throw ApiError.conflict(
          open.length > 0
            ? `That mentor is full. Choose from mentors with open seats (${open.length} available).`
            : "All mentors for this course are full right now.",
        );
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
