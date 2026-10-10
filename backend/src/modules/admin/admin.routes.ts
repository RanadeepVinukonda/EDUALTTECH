import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { supabaseAdmin } from "../../lib/supabase.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { validate, body } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { audit } from "../../lib/audit.js";
import { getSetting, setSetting, mentorCapacityDefault } from "../../lib/settings.js";
import { config } from "../../config/env.js";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

// ── Stats (dashboard tiles) ────────────────────────────────────────

router.get("/stats", async (_req, res) => {
  const since7d = new Date(Date.now() - 7 * 86_400_000);

  const [users, newUsers, activeLearners, mentors, coursesPublished, coursesDraft, coursesArchived, enrollments, revenueAgg, paymentsOk, paymentsFail, appsByStatus, unreadContact] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: since7d } } }),
      prisma.courseParticipant.count({ where: { role: "LEARNER", status: "ACTIVE" } }),
      prisma.courseParticipant.count({ where: { role: "MENTOR", status: "ACTIVE" } }),
      prisma.course.count({ where: { status: "PUBLISHED" } }),
      prisma.course.count({ where: { status: "DRAFT" } }),
      prisma.course.count({ where: { status: "ARCHIVED" } }),
      prisma.courseParticipant.count({ where: { role: "LEARNER" } }),
      prisma.order.aggregate({ where: { status: "PAID" }, _sum: { amountPaise: true }, _count: true }),
      prisma.payment.count({ where: { verified: true } }),
      prisma.order.count({ where: { status: "FAILED" } }),
      prisma.mentorApplication.groupBy({ by: ["status"], _count: true }),
      prisma.contactMessage.count({ where: { isRead: false } }),
    ]);

  res.json({
    success: true,
    data: {
      users, newUsers, activeLearners, mentors,
      courses: { published: coursesPublished, draft: coursesDraft, archived: coursesArchived, total: coursesPublished + coursesDraft + coursesArchived },
      enrollments,
      revenuePaise: revenueAgg._sum.amountPaise ?? 0,
      paidOrders: revenueAgg._count,
      payments: { ok: paymentsOk, failed: paymentsFail },
      applications: Object.fromEntries(appsByStatus.map((a) => [a.status, a._count])),
      unreadContact,
      mentorCapacityDefault: await mentorCapacityDefault(),
    },
  });
});

// ── Analytics (range-bucketed time series) ─────────────────────────

router.get("/analytics", validate({ query: z.object({ range: z.enum(["7d", "30d", "90d", "12m"]).default("30d") }) }), async (req, res) => {
  const { range } = req.query as unknown as { range: "7d" | "30d" | "90d" | "12m" };
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
  const since = new Date(Date.now() - days * 86_400_000);

  const [orders, newUsers, enrollments, topCourses] = await Promise.all([
    prisma.order.findMany({ where: { status: "PAID", createdAt: { gte: since } }, select: { amountPaise: true, createdAt: true } }),
    prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    prisma.courseParticipant.findMany({ where: { role: "LEARNER", enrolledAt: { gte: since } }, select: { enrolledAt: true } }),
    prisma.course.findMany({
      where: { status: { not: "DRAFT" } },
      select: {
        id: true, title: true, slug: true, status: true, pricePaise: true,
        _count: { select: { participants: { where: { role: "LEARNER", status: "ACTIVE" } } } },
      },
      orderBy: { participants: { _count: "desc" } },
      take: 10,
    }),
  ]);

  const bucketKey = (d: Date) => {
    if (range === "12m") return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    return d.toISOString().slice(0, 10);
  };

  const series = new Map<string, { revenuePaise: number; newUsers: number; enrollments: number }>();
  const seedKeys: string[] = [];
  const step = range === "12m" ? 30 * 86_400_000 : 86_400_000;
  for (let t = since.getTime(); t <= Date.now(); t += step) seedKeys.push(bucketKey(new Date(t)));
  for (const k of seedKeys) series.set(k, { revenuePaise: 0, newUsers: 0, enrollments: 0 });

  const bump = (key: string, field: keyof { revenuePaise: number; newUsers: number; enrollments: number }, value: number) => {
    const bucket = series.get(key) ?? { revenuePaise: 0, newUsers: 0, enrollments: 0 };
    bucket[field] += value;
    series.set(key, bucket);
  };
  for (const o of orders) bump(bucketKey(o.createdAt), "revenuePaise", o.amountPaise);
  for (const u of newUsers) bump(bucketKey(u.createdAt), "newUsers", 1);
  for (const e of enrollments) bump(bucketKey(e.enrolledAt), "enrollments", 1);

  res.json({
    success: true,
    data: {
      range,
      series: [...series.entries()].map(([date, v]) => ({ date, ...v })),
      topCourses: topCourses.map((c) => ({ ...c, enrolledCount: c._count.participants, _count: undefined })),
    },
  });
});

// ── Users ──────────────────────────────────────────────────────────

router.get("/users", validate({ query: z.object({
  q: z.string().trim().max(120).optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}) }), async (req, res) => {
  const { q, role, page, limit } = req.query as unknown as { q?: string; role?: string; page: number; limit: number };
  const where = {
    ...(role ? { role: role as never } : {}),
    ...(q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" as const } },
            { firstName: { contains: q, mode: "insensitive" as const } },
            { lastName: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      select: {
        id: true, email: true, firstName: true, lastName: true, role: true, isActive: true,
        avatarUrl: true, mobile: true, mobileVerifiedAt: true, emailVerifiedAt: true, createdAt: true,
        _count: { select: { participations: { where: { role: "LEARNER" } } } },
      },
    }),
  ]);
  res.json({ success: true, data: { users, total, page, limit, hasMore: page * limit < total } });
});

// Invite-by-email: creates Supabase auth user with an invite link (no password here).
router.post("/users", validate({ body: z.object({
  email: z.string().trim().toLowerCase().email(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  role: z.enum(["USER", "ADMIN"]).default("USER"),
}) }), async (req, res) => {
  const input = body<{ email: string; firstName: string; lastName: string; role: "USER" | "ADMIN" }>(req);

  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("An account with this email already exists", "EMAIL_TAKEN");

  const { data, error } = await supabaseAdmin().auth.admin.inviteUserByEmail(input.email, {
    data: { first_name: input.firstName, last_name: input.lastName },
    redirectTo: `${config.appBaseUrl}/auth/callback`,
  });
  if (error || !data.user) throw ApiError.badRequest(error?.message ?? "Could not send the invite");

  const user = await prisma.user.create({
    data: {
      id: data.user.id,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      emailVerifiedAt: data.user.email_confirmed_at ? new Date() : null,
    },
  });
  audit(req.user!.id, "user.invited", "user", user.id, { role: input.role });
  res.status(201).json({ success: true, data: { user } });
});

router.patch("/users/:id", validate({ body: z.object({
  role: z.enum(["USER", "ADMIN"]).optional(),
  isActive: z.boolean().optional(),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
}) }), async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, role: true } });
  if (!target) throw ApiError.notFound("User not found");
  if (target.id === req.user!.id) throw ApiError.badRequest("You cannot change your own account here");

  const patch = body<Record<string, unknown>>(req);
  if (patch.role && target.role === "ADMIN" && patch.role === "USER") {
    const admins = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
    if (admins <= 1) throw ApiError.badRequest("At least one active admin must remain", "LAST_ADMIN");
  }

  const user = await prisma.user.update({ where: { id: target.id }, data: patch });
  audit(req.user!.id, "user.updated", "user", user.id, { fields: Object.keys(patch) });
  res.json({ success: true, data: { user } });
});

// Deactivation is the default; hard delete only when no orders exist (data preserved).
router.delete("/users/:id", async (req, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true, email: true } });
  if (!target) throw ApiError.notFound("User not found");
  if (target.id === req.user!.id) throw ApiError.badRequest("You cannot delete your own account");

  const [orders, createdCourses] = await Promise.all([
    prisma.order.count({ where: { userId: target.id } }),
    prisma.course.count({ where: { createdById: target.id } }),
  ]);

  if (orders > 0 || createdCourses > 0) {
    // Preserve financial + content history: deactivate instead.
    const user = await prisma.user.update({ where: { id: target.id }, data: { isActive: false } });
    audit(req.user!.id, "user.deactivated", "user", user.id, { orders, createdCourses });
    return res.json({ success: true, data: { user, deactivated: true } });
  }

  await supabaseAdmin().auth.admin.deleteUser(target.id).catch(() => undefined);
  await prisma.user.delete({ where: { id: target.id } });
  audit(req.user!.id, "user.deleted", "user", target.id, { email: target.email });
  res.json({ success: true, data: { ok: true, deactivated: false } });
});

// ── Courses oversight ──────────────────────────────────────────────

router.get("/courses", validate({ query: z.object({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  q: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}) }), async (req, res) => {
  const { status, q, page, limit } = req.query as unknown as { status?: string; q?: string; page: number; limit: number };
  const where = {
    ...(status ? { status: status as never } : {}),
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
  };
  const [total, courses] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      select: {
        id: true, slug: true, title: true, category: true, status: true, pricePaise: true, currency: true, createdAt: true,
        createdBy: { select: { firstName: true, lastName: true } },
        _count: {
          select: {
            participants: { where: { role: "LEARNER", status: "ACTIVE" } },
            chapters: true,
          },
        },
      },
    }),
  ]);
  res.json({ success: true, data: { courses, total, page, limit, hasMore: page * limit < total } });
});

// Direct mentor assignment (bypasses application flow — admin override)
router.post("/courses/:courseId/mentors", validate({ body: z.object({
  userId: z.string().min(1),
  capacity: z.number().int().min(1).max(1000).nullable().optional(),
}) }), async (req, res) => {
  const { userId, capacity } = body<{ userId: string; capacity?: number | null }>(req);
  const course = await prisma.course.findUnique({ where: { id: req.params.courseId }, select: { id: true } });
  if (!course) throw ApiError.notFound("Course not found");

  const existing = await prisma.courseParticipant.findUnique({
    where: { courseId_userId: { courseId: course.id, userId } },
    select: { role: true },
  });
  if (existing) throw ApiError.conflict("This user already participates in the course", "ALREADY_PARTICIPANT");

  const participant = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} FOR UPDATE`;
    return tx.courseParticipant.create({
      data: { courseId: course.id, userId, role: "MENTOR", status: "ACTIVE", capacity: capacity ?? null },
    });
  });

  audit(req.user!.id, "mentor.assigned", "course", course.id, { userId });
  res.status(201).json({ success: true, data: { participant } });
});

router.get("/mentors", async (_req, res) => {
  const mentors = await prisma.courseParticipant.findMany({
    where: { role: "MENTOR" },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true } },
      course: { select: { id: true, slug: true, title: true, status: true } },
    },
    orderBy: { enrolledAt: "desc" },
  });

  const loads = await prisma.courseParticipant.groupBy({
    by: ["mentorUserId"],
    where: { role: "LEARNER", status: "ACTIVE", mentorUserId: { not: null } },
    _count: true,
  });
  const loadMap = new Map(loads.map((l) => [l.mentorUserId, l._count]));

  res.json({
    success: true,
    data: {
      mentors: mentors.map((m) => ({
        ...m,
        assignedLearners: loadMap.get(m.userId) ?? 0,
      })),
    },
  });
});

// ── Audit + settings ───────────────────────────────────────────────

router.get("/audit", validate({ query: z.object({
  actorId: z.string().optional(),
  action: z.string().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}) }), async (req, res) => {
  const { actorId, action, page, limit } = req.query as unknown as { actorId?: string; action?: string; page: number; limit: number };
  const where = { ...(actorId ? { actorId } : {}), ...(action ? { action: { contains: action } } : {}) };
  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit,
      include: { actor: { select: { firstName: true, lastName: true, email: true } } },
    }),
  ]);
  res.json({ success: true, data: { logs, total, page, limit, hasMore: page * limit < total } });
});

router.get("/settings", async (_req, res) => {
  res.json({
    success: true,
    data: {
      mentor_capacity: await mentorCapacityDefault(),
      ...((await prisma.setting.findMany({ select: { key: true, value: true } })).reduce<Record<string, unknown>>((acc, s) => {
        acc[s.key] = s.value;
        return acc;
      }, {})),
    },
  });
});

router.put("/settings", validate({ body: z.object({ key: z.string().min(1).max(60), value: z.unknown() }) }), async (req, res) => {
  const { key, value } = body<{ key: string; value: unknown }>(req);
  const allowed = new Set(["mentor_capacity"]);
  if (!allowed.has(key)) throw ApiError.badRequest(`Setting "${key}" is not editable`);
  if (key === "mentor_capacity" && (typeof value !== "number" || value < 1 || value > 1000)) {
    throw ApiError.badRequest("mentor_capacity must be a number between 1 and 1000");
  }
  await setSetting(key, value);
  audit(req.user!.id, "setting.updated", "setting", key, { value: value as never });
  res.json({ success: true, data: { key, value, current: await getSetting(key, null) } });
});

export default router;
