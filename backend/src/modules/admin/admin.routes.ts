import { Router } from "express";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { admin } from "../../lib/supabase.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { param } from "../../utils/params.js";
import { passwordSchema } from "../auth/auth.schemas.js";

const router = Router();

router.use(requireAuth, requireRole("ADMIN"));

// ── Dashboard stats ─────────────────────────────────────────────────

router.get("/stats", async (_req, res, next) => {
  try {
    const [users, admins, providers, courses, enrollments, contactMessages, paidOrders, trialOrders, resources] =
      await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { role: "ADMIN" } }),
        prisma.courseMentor.count(),
        prisma.course.count(),
        prisma.enrollment.count(),
        prisma.contactMessage.count({ where: { isRead: false } }),
        prisma.order.count({ where: { status: "PAID", plan: "FULL" } }),
        prisma.order.count({ where: { status: "PAID", plan: "TRIAL" } }),
        prisma.resource.count(),
      ]);

    res.json({
      success: true,
      data: {
        users,
        admins,
        providers,
        courses,
        enrollments,
        unreadMessages: contactMessages,
        paidOrders,
        trialOrders,
        resources,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ── Users management ────────────────────────────────────────────────

router.get("/users", async (req, res, next) => {
  try {
    const q = z
      .object({
        role: z.enum(["USER", "ADMIN"]).optional(),
        search: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
      })
      .parse(req.query);

    const where = {
      ...(q.role ? { role: q.role } : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: "insensitive" as const } },
              { email: { contains: q.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          schoolName: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ success: true, data: { items, total, page: q.page, limit: q.limit } });
  } catch (err) {
    next(err);
  }
});

const userPatchSchema = z.object({
  isActive: z.boolean().optional(),
  role: z.enum(["USER", "ADMIN"]).optional(),
});

router.patch("/users/:id", validate(userPatchSchema), async (req, res, next) => {
  try {
    const userId = param(req, "id");
    if (userId === req.user!.id) {
      throw ApiError.badRequest("You cannot change your own role/status");
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");

    const patch = req.body as z.infer<typeof userPatchSchema>;
    if (patch.role && patch.role !== user.role) {
      if (user.role === "ADMIN") {
        const adminCount = await prisma.user.count({ where: { role: "ADMIN", isActive: true } });
        if (adminCount <= 1) throw ApiError.conflict("Refusing to demote the last active admin");
      }
      // Force the user to sign in again after a role change.
      await admin.auth.admin.signOut(userId);
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: patch,
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });
    res.json({ success: true, data: { user: updated } });
  } catch (err) {
    next(err);
  }
});

// ── Create / delete accounts (superadmin) ───────────────────────────

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().max(160),
  password: passwordSchema,
  role: z.enum(["USER", "ADMIN"]),
});

router.post("/users", validate(createUserSchema), async (req, res, next) => {
  try {
    const data = req.body as z.infer<typeof createUserSchema>;
    const email = data.email.toLowerCase().trim();
    if (await prisma.user.findUnique({ where: { email } })) {
      throw ApiError.conflict("An account with this email already exists");
    }

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name },
    });
    if (error) {
      if (/already registered/i.test(error.message)) throw ApiError.conflict("An account with this email already exists");
      throw ApiError.badRequest(error.message);
    }

    const user = await prisma.user.create({
      data: {
        id: created.user.id,
        name: data.name,
        email,
        role: data.role,
        // Admin-created accounts are trusted: no email/phone ceremony.
        emailVerifiedAt: new Date(),
        onboardingDone: true,
      },
      select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
    });
    res.status(201).json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
});

router.delete("/users/:id", async (req, res, next) => {
  try {
    const userId = param(req, "id");
    if (userId === req.user!.id) throw ApiError.badRequest("You cannot delete your own account");

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");

    if (user.role === "ADMIN") {
      const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) throw ApiError.conflict("Refusing to delete the last admin");
    }

    await prisma.user.delete({ where: { id: userId } });
    // Remove the Supabase auth identity too, so the address can be reused.
    await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    res.json({ success: true, data: { message: "Account deleted" } });
  } catch (err) {
    next(err);
  }
});

// ── Courses & mentors (superadmin) ──────────────────────────────────

router.get("/courses", async (_req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        mentors: {
          include: { mentor: { select: { id: true, name: true, email: true } }, _count: { select: { chapters: true, enrollments: true } } },
        },
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: { courses } });
  } catch (err) {
    next(err);
  }
});

router.get("/mentors", async (_req, res, next) => {
  try {
    const mentors = await prisma.user.findMany({
      where: { role: "USER" },
      select: { id: true, name: true, email: true, isActive: true, _count: { select: { mentorships: true } } },
      orderBy: { name: "asc" },
    });
    res.json({ success: true, data: { mentors } });
  } catch (err) {
    next(err);
  }
});

const assignMentorSchema = z.object({ mentorId: z.string().min(1).max(40) });

router.post("/courses/:id/mentors", validate(assignMentorSchema), async (req, res, next) => {
  try {
    const courseId = param(req, "id");
    const { mentorId } = req.body as z.infer<typeof assignMentorSchema>;

    const [course, mentor] = await Promise.all([
      prisma.course.findUnique({ where: { id: courseId } }),
      prisma.user.findUnique({ where: { id: mentorId }, select: { id: true, isActive: true } }),
    ]);
    if (!course) throw ApiError.notFound("Course not found");
    if (!mentor || !mentor.isActive) throw ApiError.badRequest("That account cannot be assigned as a mentor");

    const assignment = await prisma.courseMentor.upsert({
      where: { courseId_mentorId: { courseId, mentorId } },
      update: {},
      create: { courseId, mentorId },
      include: { mentor: { select: { id: true, name: true, email: true } } },
    });
    res.status(201).json({ success: true, data: { assignment } });
  } catch (err) {
    next(err);
  }
});

router.delete("/courses/:id/mentors/:mentorId", async (req, res, next) => {
  try {
    const courseId = param(req, "id");
    const mentorId = param(req, "mentorId");
    const assignment = await prisma.courseMentor.findUnique({ where: { courseId_mentorId: { courseId, mentorId } } });
    if (!assignment) throw ApiError.notFound("Mentor is not assigned to this course");

    await prisma.courseMentor.delete({ where: { id: assignment.id } });
    res.json({ success: true, data: { message: "Mentor removed from course" } });
  } catch (err) {
    next(err);
  }
});

// ── Contact messages ────────────────────────────────────────────────

router.get("/messages", async (_req, res, next) => {
  try {
    const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
    res.json({ success: true, data: { messages } });
  } catch (err) {
    next(err);
  }
});

const messagePatchSchema = z.object({ isRead: z.boolean() });

router.patch("/messages/:id", validate(messagePatchSchema), async (req, res, next) => {
  try {
    const message = await prisma.contactMessage.findUnique({ where: { id: param(req, "id") } });
    if (!message) throw ApiError.notFound("Message not found");
    const updated = await prisma.contactMessage.update({
      where: { id: message.id },
      data: { isRead: req.body.isRead, handledAt: req.body.isRead ? new Date() : null },
    });
    res.json({ success: true, data: { message: updated } });
  } catch (err) {
    next(err);
  }
});

// ── Platform settings ───────────────────────────────────────────────

const settingSchema = z.object({
  key: z.string().min(1).max(80),
  value: z.unknown(),
});

router.get("/settings", async (_req, res, next) => {
  try {
    const settings = await prisma.setting.findMany({ orderBy: { key: "asc" } });
    res.json({ success: true, data: { settings } });
  } catch (err) {
    next(err);
  }
});

router.put("/settings", validate(settingSchema), async (req, res, next) => {
  try {
    const { key, value } = req.body as { key: string; value: unknown };
    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value: value as Prisma.InputJsonValue },
      create: { key, value: value as Prisma.InputJsonValue },
    });
    res.json({ success: true, data: { setting } });
  } catch (err) {
    next(err);
  }
});

export default router;
