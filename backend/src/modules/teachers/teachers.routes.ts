import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { param } from "../../utils/params.js";
import { applicationStatusEmail } from "../../lib/email.js";
import { audit } from "../../lib/audit.js";
import { canTransition } from "../../lib/invariants.js";
import { assertNotSeeking, lockUser } from "../../lib/course-roles.js";
import { logger } from "../../utils/logger.js";
import { config } from "../../config/env.js";
import { publicFileUrl, uploadFile } from "../../lib/storage.js";

const router = Router();

// ── Resume upload ───────────────────────────────────────────────────

const RESUME_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};
const RESUME_MAX_BYTES = 5 * 1024 * 1024;

// Raw body → Supabase Storage → returns the URL. Mirrors the avatar upload so
// no multipart dependency creeps in for a single small file.
router.post("/resume", requireAuth, async (req, res, next) => {
  try {
    const raw = (req.headers["x-resume-mime"] ?? req.headers["content-type"] ?? "").toString();
    const mime = raw.split(/[;,]/)[0]?.trim() ?? "";
    const ext = RESUME_MIME[mime];
    if (!ext) throw ApiError.badRequest("Resume must be a PDF, DOC or DOCX file");

    const length = Number(req.headers["content-length"] ?? 0);
    if (!Number.isFinite(length) || length <= 0) throw ApiError.badRequest("Missing Content-Length");
    if (length > RESUME_MAX_BYTES) throw ApiError.badRequest("Resume too large — max 5 MB");

    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const body = Buffer.concat(chunks);
    if (body.byteLength !== length) throw ApiError.badRequest("Body size does not match Content-Length");

    const path = `resumes/${req.user!.id}/${randomUUID()}.${ext}`;
    await uploadFile(config.supabase.storageBucket, path, body, mime);
    res.status(201).json({ success: true, data: { resumeUrl: publicFileUrl(config.supabase.storageBucket, path) } });
  } catch (err) {
    next(err);
  }
});

// ── Apply to join as teacher ────────────────────────────────────────

const applySchema = z.object({
  subject: z.string().min(2).max(80),
  experience: z.number().int().min(0).max(60).optional(),
  qualifications: z.string().max(1_000).optional(),
  courseId: z.string().min(1).max(40).optional(),
  resumeUrl: z.string().url().optional(),
  message: z.string().max(2_000).optional(),
});

router.post("/apply", requireAuth, validate(applySchema), async (req, res, next) => {
  try {
    const body = req.body as z.infer<typeof applySchema>;
    if (body.courseId) {
      const course = await prisma.course.findUnique({ where: { id: body.courseId } });
      if (!course) throw ApiError.badRequest("That course does not exist");
    }

    // One application per user per course (DB unique enforces it). An
    // APPROVED mentor may apply to another course; a non-REJECTED row for
    // this course blocks re-applying.
    const application = await prisma.$transaction(async (tx) => {
      // Lock the applicant so enroll/approve/assign paths for the same user serialize.
      await lockUser(tx, req.user!.id);
      const existing = await tx.teacherApplication.findFirst({
        where: { userId: req.user!.id, courseId: body.courseId ?? null },
      });
      if (existing && existing.status !== "REJECTED") {
        throw ApiError.conflict(
          existing.status === "APPROVED"
            ? "You are already an approved mentor for this course"
            : "Your application for this course is already in progress — wait for a decision before re-applying",
        );
      }
      if (body.courseId) {
        const alreadyMentor = await tx.courseMentor.findUnique({
          where: { courseId_mentorId: { courseId: body.courseId, mentorId: req.user!.id } },
        });
        if (alreadyMentor) throw ApiError.conflict("You are already a mentor for this course");
        const ownsCourse = await tx.course.findFirst({
          where: { id: body.courseId, teacherId: req.user!.id },
          select: { id: true },
        });
        if (ownsCourse) throw ApiError.conflict("You already own this course — no application needed");
        await assertNotSeeking(tx, req.user!.id, body.courseId);
      }
      const data = {
        status: "PENDING" as const,
        reviewedAt: null,
        reviewedBy: null,
        reviewNote: null,
        meetingLink: null,
        ...body,
      };
      return existing
        ? tx.teacherApplication.update({ where: { id: existing.id }, data })
        : tx.teacherApplication.create({ data: { userId: req.user!.id, ...data } });
    });

    // Alert admins by mail so applications don't sit in the queue.
    const [admins, applicant] = await Promise.all([
      prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { email: true, name: true } }),
      prisma.user.findUnique({ where: { id: req.user!.id }, select: { name: true, email: true } }),
    ]);
    const applicantName = applicant?.name ?? req.user!.email;
    for (const admin of admins) {
      await applicationStatusEmail(
        {
          to: admin.email,
          name: admin.name,
          note: `New application from ${applicantName} (${req.user!.email}) to teach ${body.subject}. Open the admin panel to review.`,
        },
        "New mentor application awaiting review",
      ).catch((err: unknown) => logger.warn("Admin notification email failed", { err }));
    }

    res.status(201).json({ success: true, data: { application } });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const courseId = typeof req.query.courseId === "string" ? req.query.courseId : undefined;
    const application = await prisma.teacherApplication.findFirst({
      where: { userId: req.user!.id, ...(courseId ? { courseId } : {}) },
      orderBy: { createdAt: "desc" },
      include: { course: { select: { id: true, title: true, slug: true } } },
    });
    res.json({ success: true, data: { application } });
  } catch (err) {
    next(err);
  }
});

// ── Public: showcase approved providers on the marketing site ───────
// Mentors attached to published courses, most recent first, deduped by
// mentor so the same person never appears twice across courses.

router.get("/providers", async (_req, res, next) => {
  try {
    const rows = await prisma.courseMentor.findMany({
      where: { course: { isPublished: true } },
      select: {
        mentor: { select: { id: true, name: true, avatarUrl: true, education: true, bio: true } },
        course: { select: { title: true, subject: true, _count: { select: { enrollments: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 24,
    });

    const seen = new Set<string>();
    const items = rows
      .filter((r) => {
        if (seen.has(r.mentor.id)) return false;
        seen.add(r.mentor.id);
        return true;
      })
      .map((r) => ({
        id: r.mentor.id,
        name: r.mentor.name,
        avatarUrl: r.mentor.avatarUrl,
        education: r.mentor.education,
        bio: r.mentor.bio,
        courseTitle: r.course.title,
        subject: r.course.subject,
        enrollments: r.course._count.enrollments,
      }));

    res.json({ success: true, data: { items } });
  } catch (err) {
    next(err);
  }
});

// ── Provider panel: courses I own or mentor, plus my activity ───────

router.get("/panel", requireAuth, async (req, res, next) => {
  try {
    const where =
      req.user!.role === "ADMIN"
        ? {}
        : { OR: [{ teacherId: req.user!.id }, { mentors: { some: { mentorId: req.user!.id } } }] };

    const [courses, notifications] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          _count: { select: { enrollments: true, modules: true, chats: true } },
          enrollments: { where: { status: "ACTIVE" }, select: { studentId: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.findMany({
        where: { senderId: req.user!.id },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    res.json({ success: true, data: { courses, notifications } });
  } catch (err) {
    next(err);
  }
});

// ── Admin: review teacher applications ──────────────────────────────

router.get("/applications", requireAuth, requireRole("ADMIN"), async (_req, res, next) => {
  try {
    const applications = await prisma.teacherApplication.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, schoolName: true } },
        course: { select: { id: true, title: true, slug: true, thumbnailUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: { applications } });
  } catch (err) {
    next(err);
  }
});

const reviewSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "UNDER_REVIEW", "INTERVIEW"]),
  reviewNote: z.string().max(1_000).optional(),
  meetingLink: z.string().url().optional(),
});

const STATUS_SUBJECT: Record<string, string> = {
  UNDER_REVIEW: "Your Edu-Alt-Tech mentor application is under review",
  INTERVIEW: "Interview scheduled for your Edu-Alt-Tech mentor application",
  APPROVED: "You're approved as an Edu-Alt-Tech mentor",
  REJECTED: "Update on your Edu-Alt-Tech mentor application",
};

router.post("/applications/:id/review", requireAuth, requireRole("ADMIN"), validate(reviewSchema), async (req, res, next) => {
  try {
    const app = await prisma.teacherApplication.findUnique({
      where: { id: param(req, "id") },
      include: { user: { select: { name: true, email: true } }, course: { select: { title: true } } },
    });
    if (!app) throw ApiError.notFound("Application not found");

    const { status, reviewNote, meetingLink } = req.body as z.infer<typeof reviewSchema>;
    if (!canTransition(app.status, status)) {
      throw ApiError.conflict(
        `Cannot move an application from ${app.status} to ${status} — approved and rejected decisions are final`,
      );
    }
    if (status === "INTERVIEW" && !meetingLink && !app.meetingLink) {
      throw ApiError.badRequest("Add an interview meeting link before moving to interview");
    }

    // Approving a mentor for a course they're actively learning would create a
    // seek+mentor split. The lock + re-check inside the transaction is what
    // actually enforces it — a concurrent enroll can't slip past it.
    const updated = await prisma.$transaction(async (tx) => {
      if (status === "APPROVED" && app.courseId) {
        await lockUser(tx, app.userId);
        await assertNotSeeking(tx, app.userId, app.courseId);
      }
      const row = await tx.teacherApplication.update({
        where: { id: app.id },
        data: { status, reviewNote, meetingLink, reviewedBy: req.user!.id, reviewedAt: new Date() },
      });
      // Approval attaches them as a provider for the course they applied for.
      // No role change: they are still a normal USER who can also learn.
      if (status === "APPROVED" && app.courseId) {
        await tx.courseMentor.upsert({
          where: { courseId_mentorId: { courseId: app.courseId, mentorId: app.userId } },
          update: {},
          create: { courseId: app.courseId, mentorId: app.userId },
        });
      }
      return row;
    });

    audit(req.user!.id, "MENTOR_APPLICATION_REVIEWED", "TeacherApplication", app.id, { status, toStatus: status, fromStatus: app.status, courseId: app.courseId });

    try {
      await applicationStatusEmail(
        { to: app.user.email, name: app.user.name, courseTitle: app.course?.title, note: interviewNote(status, reviewNote, meetingLink ?? app.meetingLink) },
        STATUS_SUBJECT[status] ?? "Update on your Edu-Alt-Tech mentor application",
      );
    } catch (err) {
      logger.warn("Application status email could not be sent", { applicationId: app.id, err });
    }

    res.json({ success: true, data: { application: updated } });
  } catch (err) {
    next(err);
  }
});

function interviewNote(status: string, note: string | undefined, meetingLink: string | null | undefined): string {
  if (status === "INTERVIEW" && meetingLink) {
    return `${note ?? "We'd like to meet you for a short interview."}\n\nJoin here: ${meetingLink}`;
  }
  return note ?? "";
}

export default router;
