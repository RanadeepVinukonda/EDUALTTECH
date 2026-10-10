import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, optionalAuth } from "../../middlewares/auth.js";
import { validate, body } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { audit } from "../../lib/audit.js";
import { getCourseAccess, assertCourseOwner, assertCourseParticipant, type CourseAccess } from "../../lib/course-access.js";
import { enrollFree } from "../../lib/enrollment.js";

const router = Router();

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

const PUBLIC_READ: CourseAccess = {
  isAdmin: false, isCreator: false, isMentor: false, isLearner: false,
  isStaff: false, canRead: true,
};

// ── Catalog (public) ───────────────────────────────────────────────

router.get("/", optionalAuth, validate({ query: z.object({
  q: z.string().trim().max(120).optional(),
  category: z.string().trim().max(60).optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
}) }), async (req, res) => {
  const { q, category, sort, page, limit } = req.query as unknown as {
    q?: string; category?: string; sort?: string; page: number; limit: number;
  };

  const where = {
    status: "PUBLISHED" as const,
    ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { description: { contains: q, mode: "insensitive" as const } }] } : {}),
    ...(category ? { category } : {}),
  };

  const orderBy =
    sort === "price_asc" ? { pricePaise: "asc" as const } :
    sort === "price_desc" ? { pricePaise: "desc" as const } :
    { createdAt: "desc" as const };

  const [total, courses] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where, orderBy, skip: (page - 1) * limit, take: limit,
      select: {
        id: true, slug: true, title: true, description: true, category: true,
        gradeLevel: true, pricePaise: true, currency: true, thumbnailUrl: true,
        createdAt: true,
        createdBy: { select: { firstName: true, lastName: true, avatarUrl: true } },
        _count: { select: { participants: { where: { role: "LEARNER", status: "ACTIVE" } } } },
        participants: {
          where: { role: "MENTOR", status: "ACTIVE" },
          select: { user: { select: { firstName: true, lastName: true } } },
        },
      },
    }),
  ]);

  const items = courses.map(({ participants, _count, ...c }) => ({
    ...c,
    enrolledCount: _count.participants,
    mentorNames: participants.map((m) => `${m.user.firstName} ${m.user.lastName}`.trim()),
  }));

  res.json({ success: true, data: { items, total, page, limit, hasMore: page * limit < total } });
});

router.get("/categories", async (_req, res) => {
  const rows = await prisma.course.findMany({
    where: { status: "PUBLISHED", category: { not: "" } },
    distinct: ["category"],
    select: { category: true },
    orderBy: { category: "asc" },
  });
  res.json({ success: true, data: { categories: rows.map((r) => r.category).filter(Boolean) } });
});

// ── My courses ─────────────────────────────────────────────────────

router.get("/mine", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const [learning, mentoring] = await Promise.all([
    prisma.courseParticipant.findMany({
      where: { userId, role: "LEARNER" },
      orderBy: { enrolledAt: "desc" },
      include: {
        course: { select: { id: true, slug: true, title: true, thumbnailUrl: true, category: true, status: true, pricePaise: true, currency: true } },
      },
    }),
    prisma.courseParticipant.findMany({
      where: { userId, role: "MENTOR" },
      orderBy: { enrolledAt: "desc" },
      include: {
        course: { select: { id: true, slug: true, title: true, thumbnailUrl: true, category: true, status: true } },
      },
    }),
  ]);

  // Assigned mentors hydrate via mentorUserId (no named relation on the model).
  const mentorIds = [...new Set(learning.map((l) => l.mentorUserId).filter((id): id is string => !!id))];
  const mentors = mentorIds.length === 0
    ? []
    : await prisma.user.findMany({
        where: { id: { in: mentorIds } },
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      });
  const mentorMap = new Map(mentors.map((m) => [m.id, m]));

  res.json({
    success: true,
    data: {
      learning: learning.map((l) => ({ ...l, mentor: l.mentorUserId ? (mentorMap.get(l.mentorUserId) ?? null) : null })),
      mentoring,
    },
  });
});

// ── Course detail by slug or id ────────────────────────────────────

router.get("/:slug", optionalAuth, async (req, res) => {
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: req.params.slug }, { slug: req.params.slug }] },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, bio: true } },
      chapters: {
        orderBy: { order: "asc" },
        select: {
          id: true, title: true, summary: true, order: true,
          topics: { orderBy: { order: "asc" }, select: { id: true, title: true, order: true, _count: { select: { lessons: true } } } },
        },
      },
      participants: {
        where: { role: "MENTOR", status: "ACTIVE" },
        select: { capacity: true, user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, bio: true } } },
      },
      meetings: {
        where: { scheduledAt: { gte: new Date() } },
        orderBy: { scheduledAt: "asc" },
        take: 5,
        select: { id: true, title: true, scheduledAt: true, durationMin: true, meetingUrl: true },
      },
      _count: { select: { participants: { where: { role: "LEARNER", status: "ACTIVE" } } } },
    },
  });
  if (!course) throw ApiError.notFound("Course not found");

  let access: CourseAccess;
  if (req.user) {
    access = await getCourseAccess(course.id, req.user);
    if (!access.canRead) throw ApiError.notFound("Course not found");
  } else if (course.status === "PUBLISHED") {
    access = PUBLIC_READ;
  } else {
    throw ApiError.notFound("Course not found");
  }

  const myParticipation = req.user
    ? await prisma.courseParticipant.findUnique({
        where: { courseId_userId: { courseId: course.id, userId: req.user.id } },
        select: { id: true, role: true, status: true, progressPct: true, mentorUserId: true, currentTopicId: true },
      })
    : null;

  const myWishlist = req.user
    ? !!(await prisma.wishlistItem.findUnique({
        where: { userId_courseId: { userId: req.user.id, courseId: course.id } },
      }))
    : false;

  const myApplication = req.user
    ? await prisma.mentorApplication.findFirst({
        where: { courseId: course.id, userId: req.user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true, status: true },
      })
    : null;

  const { participants, _count, meetings, ...rest } = course;
  const isStaff = access.isStaff;

  res.json({
    success: true,
    data: {
      course: {
        ...rest,
        chapters: course.chapters,
        mentors: participants.map((m) => ({ user: m.user, capacity: m.capacity })),
        enrolledCount: _count.participants,
        upcomingMeetings: meetings,
        isStaff,
      },
      access,
      myParticipation,
      myWishlist,
      myApplication,
    },
  });
});

// ── Learner roster (course staff only) ─────────────────────────────

router.get("/:slug/learners", requireAuth, async (req, res) => {
  const course = await prisma.course.findFirst({
    where: { OR: [{ id: req.params.slug }, { slug: req.params.slug }] },
    select: { id: true },
  });
  if (!course) throw ApiError.notFound("Course not found");

  const access = await getCourseAccess(course.id, req.user!);
  if (!access.isStaff) throw ApiError.forbidden("Only course staff can view the learner roster");

  const rows = await prisma.courseParticipant.findMany({
    where: { courseId: course.id, role: "LEARNER", status: "ACTIVE" },
    orderBy: { enrolledAt: "desc" },
    select: {
      id: true, status: true, progressPct: true, enrolledAt: true, mentorUserId: true,
      user: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true } },
    },
  });

  const mentorIds = [...new Set(rows.map((r) => r.mentorUserId).filter((id): id is string => !!id))];
  const mentors = mentorIds.length === 0
    ? []
    : await prisma.user.findMany({
        where: { id: { in: mentorIds } },
        select: { id: true, firstName: true, lastName: true },
      });
  const mentorMap = new Map(mentors.map((m) => [m.id, m]));

  res.json({
    success: true,
    data: {
      learners: rows.map((r) => ({
        id: r.id,
        user: r.user,
        status: r.status,
        progressPct: r.progressPct,
        enrolledAt: r.enrolledAt,
        mentor: r.mentorUserId ? (mentorMap.get(r.mentorUserId) ?? null) : null,
      })),
      total: rows.length,
    },
  });
});

// ── Create (admin) ─────────────────────────────────────────────────

const courseBody = z.object({
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().min(10).max(8000),
  category: z.string().trim().max(60).default("General"),
  gradeLevel: z.string().trim().max(40).nullable().optional(),
  pricePaise: z.number().int().min(0).max(10_000_000).default(0),
  thumbnailUrl: z.string().url().nullable().optional(),
  roadmapTitle: z.string().trim().max(160).nullable().optional(),
  roadmapSummary: z.string().trim().max(2000).nullable().optional(),
});

router.post("/", requireAuth, validate({ body: courseBody }), async (req, res) => {
  if (req.user!.role !== "ADMIN") throw ApiError.forbidden("Only admins can create courses");
  const input = body<z.infer<typeof courseBody>>(req);

  let slug = slugify(input.title);
  if (await prisma.course.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36)}`;

  const course = await prisma.course.create({
    data: { ...input, slug, createdById: req.user!.id },
  });
  audit(req.user!.id, "course.created", "course", course.id, { title: course.title });
  res.status(201).json({ success: true, data: { course } });
});

// ── Update + lifecycle (admin/creator) ─────────────────────────────

router.patch("/:id", requireAuth, validate({ body: courseBody.partial().extend({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
}) }), async (req, res) => {
  const { status, ...patch } = body<z.infer<typeof courseBody> & { status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" }>(req);
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) throw ApiError.notFound("Course not found");
  await assertCourseOwner(course.id, req.user!);

  const data: Record<string, unknown> = { ...patch };

  if (status && status !== course.status) {
    if (status === "PUBLISHED") {
      const chapters = await prisma.chapter.count({ where: { courseId: course.id } });
      const topics = await prisma.topic.count({ where: { courseId: course.id } });
      if (chapters === 0 || topics === 0) {
        throw ApiError.badRequest("Add at least one chapter with a topic before publishing", "ROADMAP_INCOMPLETE");
      }
      if (course.status === "ARCHIVED") {
        throw ApiError.badRequest("Unarchive to DRAFT first, then publish");
      }
    }
    data.status = status;
  }

  if (patch.title && patch.title !== course.title) data.slug = slugify(patch.title);

  const updated = await prisma.course.update({ where: { id: course.id }, data: data as never });
  if (status && status !== course.status) {
    audit(req.user!.id, `course.${status.toLowerCase()}`, "course", course.id, { from: course.status, to: status });
  }
  res.json({ success: true, data: { course: updated } });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) throw ApiError.notFound("Course not found");
  await assertCourseOwner(course.id, req.user!);

  const [participants, paidOrders] = await Promise.all([
    prisma.courseParticipant.count({ where: { courseId: course.id } }),
    prisma.order.count({ where: { courseId: course.id, status: "PAID" } }),
  ]);
  if (paidOrders > 0) throw ApiError.conflict("Paid orders exist — archive the course instead", "HAS_ORDERS");
  if (participants > 0) throw ApiError.conflict("Enrolled participants exist — archive the course instead", "HAS_PARTICIPANTS");

  await prisma.course.delete({ where: { id: course.id } });
  audit(req.user!.id, "course.deleted", "course", course.id, { title: course.title });
  res.json({ success: true, data: { ok: true } });
});

// ── Enroll (free courses; paid goes through /api/payments) ─────────

router.post("/:id/enroll", requireAuth, async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course || course.status !== "PUBLISHED") throw ApiError.notFound("Course not found");
  if (course.pricePaise > 0) {
    throw ApiError.badRequest("This course is paid — complete checkout first", "PAYMENT_REQUIRED");
  }
  const result = await enrollFree(course.id, req.user!.id);
  res.status(201).json({ success: true, data: result });
});

// ── Progress (learner) ─────────────────────────────────────────────

router.post("/:id/open-topic", requireAuth, validate({ body: z.object({ topicId: z.string().min(1) }) }), async (req, res) => {
  const { topicId } = body<{ topicId: string }>(req);
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) throw ApiError.notFound("Course not found");
  await assertCourseParticipant(course.id, req.user!);

  const topic = await prisma.topic.findFirst({ where: { id: topicId, courseId: course.id }, select: { id: true } });
  if (!topic) throw ApiError.notFound("Topic not found");

  await prisma.courseParticipant.update({
    where: { courseId_userId: { courseId: course.id, userId: req.user!.id } },
    data: { currentTopicId: topic.id },
  });
  res.json({ success: true, data: { ok: true } });
});

router.post("/lessons/:lessonId/complete", requireAuth, async (req, res) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: req.params.lessonId },
    select: { id: true, courseId: true, isPublished: true },
  });
  if (!lesson || !lesson.isPublished) throw ApiError.notFound("Lesson not found");

  const courseId = lesson.courseId;
  const access = await assertCourseParticipant(courseId, req.user!);
  if (!access.isLearner) throw ApiError.forbidden("Only enrolled learners track progress");

  const participant = await prisma.courseParticipant.findUnique({
    where: { courseId_userId: { courseId, userId: req.user!.id } },
    select: { id: true },
  });
  if (!participant) throw ApiError.forbidden("You are not enrolled in this course");

  await prisma.lessonProgress.upsert({
    where: { participantId_lessonId: { participantId: participant.id, lessonId: lesson.id } },
    update: { completedAt: new Date() },
    create: { participantId: participant.id, lessonId: lesson.id, completedAt: new Date() },
  });

  const [total, done] = await Promise.all([
    prisma.lesson.count({ where: { courseId, isPublished: true } }),
    prisma.lessonProgress.count({
      where: { participantId: participant.id, lesson: { courseId, isPublished: true } },
    }),
  ]);
  const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;
  await prisma.courseParticipant.update({
    where: { id: participant.id },
    data: { progressPct },
  });

  res.json({ success: true, data: { progressPct } });
});

export default router;
