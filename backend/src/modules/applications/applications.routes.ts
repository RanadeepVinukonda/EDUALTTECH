import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { uploadPrivate, signedUrl, assertUploadable } from "../../lib/storage.js";
import { sendEmail, layout } from "../../lib/email.js";
import { audit } from "../../lib/audit.js";
import { requireAuth, requireRole, requireVerifiedMobile } from "../../middlewares/auth.js";
import { validate, body } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";

const router = Router();

const includeFull = {
  user: { select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, mobile: true } },
  course: { select: { id: true, slug: true, title: true, category: true, status: true } },
} as const;

const fileMeta = z.object({
  name: z.string().min(1).max(200),
  type: z.string().regex(/^(application|image|text)\/[\w.+-]+$/),
  data: z.string().min(16), // base64
});

// ── Submit application (verified mobile, spec §7) ──────────────────

router.post(
  "/",
  requireAuth,
  requireVerifiedMobile,
  validate({
    body: z.object({
      courseId: z.string().min(1),
      qualification: z.string().trim().min(10).max(3000),
      message: z.string().trim().max(3000).nullable().optional(),
      resume: fileMeta,
    }),
  }),
  async (req, res) => {
    const input = body<{ courseId: string; qualification: string; message?: string | null; resume: z.infer<typeof fileMeta> }>(req);
    const userId = req.user!.id;

    const course = await prisma.course.findUnique({ where: { id: input.courseId } });
    if (!course || course.status !== "PUBLISHED") throw ApiError.notFound("Course not found");

    const existingParticipant = await prisma.courseParticipant.findUnique({
      where: { courseId_userId: { courseId: input.courseId, userId } },
      select: { role: true },
    });
    if (existingParticipant) throw ApiError.conflict("You are already part of this course", "ALREADY_PARTICIPANT");

    const open = await prisma.mentorApplication.findFirst({
      where: { courseId: input.courseId, userId, status: { notIn: ["REJECTED"] } },
      select: { id: true, status: true },
    });
    if (open) throw ApiError.conflict("You already have an application for this course", "APPLICATION_EXISTS");

    const bytes = Buffer.from(input.resume.data, "base64");
    assertUploadable(input.resume.name, bytes.length);
    const resumePath = await uploadPrivate(`applications/${input.courseId}`, input.resume.name, bytes, input.resume.type);

    const application = await prisma.mentorApplication.create({
      data: {
        userId,
        courseId: input.courseId,
        qualification: input.qualification,
        message: input.message ?? null,
        resumePath,
      },
      include: includeFull,
    });

    audit(userId, "application.submitted", "mentorApplication", application.id, { courseId: input.courseId });
    res.status(201).json({ success: true, data: { application } });
  },
);

router.get("/mine", requireAuth, async (req, res) => {
  const applications = await prisma.mentorApplication.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    include: includeFull,
  });
  res.json({ success: true, data: { applications } });
});

router.get("/:id", requireAuth, async (req, res) => {
  const application = await prisma.mentorApplication.findUnique({ where: { id: req.params.id }, include: includeFull });
  if (!application) throw ApiError.notFound("Application not found");
  if (application.userId !== req.user!.id && req.user!.role !== "ADMIN") {
    throw ApiError.forbidden("Not your application");
  }
  res.json({ success: true, data: { application } });
});

// ── Admin queue ────────────────────────────────────────────────────

router.get("/", requireAuth, requireRole("ADMIN"), validate({ query: z.object({
  status: z.enum(["SUBMITTED", "UNDER_REVIEW", "INTERVIEW_SCHEDULED", "ACCEPTED", "REJECTED"]).optional(),
  courseId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}) }), async (req, res) => {
  const { status, courseId, page, limit } = req.query as unknown as {
    status?: string; courseId?: string; page: number; limit: number;
  };
  const where = { ...(status ? { status: status as never } : {}), ...(courseId ? { courseId } : {}) };

  const [total, applications] = await Promise.all([
    prisma.mentorApplication.count({ where }),
    prisma.mentorApplication.findMany({
      where, orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit, take: limit, include: includeFull,
    }),
  ]);
  res.json({ success: true, data: { applications, total, page, limit, hasMore: page * limit < total } });
});

// ── Review state machine ───────────────────────────────────────────

const TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["UNDER_REVIEW", "INTERVIEW_SCHEDULED", "REJECTED"],
  UNDER_REVIEW: ["INTERVIEW_SCHEDULED", "ACCEPTED", "REJECTED"],
  INTERVIEW_SCHEDULED: ["ACCEPTED", "REJECTED"],
  ACCEPTED: [],
  REJECTED: [],
};

router.post(
  "/:id/review",
  requireAuth,
  requireRole("ADMIN"),
  validate({
    body: z.object({
      action: z.enum(["UNDER_REVIEW", "INTERVIEW_SCHEDULED", "ACCEPTED", "REJECTED"]),
      interviewUrl: z.string().url().nullable().optional(),
      interviewAt: z.coerce.date().nullable().optional(),
      note: z.string().trim().max(2000).nullable().optional(),
    }),
  }),
  async (req, res) => {
    const { action, interviewUrl, interviewAt, note } = body<{
      action: "UNDER_REVIEW" | "INTERVIEW_SCHEDULED" | "ACCEPTED" | "REJECTED";
      interviewUrl?: string | null; interviewAt?: Date | null; note?: string | null;
    }>(req);

    const application = await prisma.mentorApplication.findUnique({
      where: { id: req.params.id },
      include: includeFull,
    });
    if (!application) throw ApiError.notFound("Application not found");

    const allowed = TRANSITIONS[application.status] ?? [];
    if (!allowed.includes(action)) {
      throw ApiError.badRequest(`Cannot move from ${application.status} to ${action}`, "INVALID_TRANSITION");
    }

    let mentorParticipantId: string | null = null;
    if (action === "ACCEPTED") {
      // Atomic accept: exclusivity (one row per user per course) is the DB constraint.
      const existing = await prisma.courseParticipant.findUnique({
        where: { courseId_userId: { courseId: application.courseId, userId: application.userId } },
        select: { id: true },
      });
      if (existing) throw ApiError.conflict("This user already participates in the course", "ALREADY_PARTICIPANT");

      const created = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${application.userId} FOR UPDATE`;
        const p = await tx.courseParticipant.create({
          data: {
            courseId: application.courseId,
            userId: application.userId,
            role: "MENTOR",
            capacity: null, // null → platform mentor_capacity setting
            status: "ACTIVE",
          },
        });
        await tx.mentorApplication.update({
          where: { id: application.id },
          data: {
            status: "ACCEPTED",
            reviewedById: req.user!.id,
            reviewedAt: new Date(),
            reviewNote: note ?? null,
          },
        });
        return p.id;
      });
      mentorParticipantId = created;
    } else {
      await prisma.mentorApplication.update({
        where: { id: application.id },
        data: {
          status: action,
          reviewedById: req.user!.id,
          reviewedAt: new Date(),
          reviewNote: note ?? application.reviewNote,
          ...(action === "INTERVIEW_SCHEDULED"
            ? { interviewUrl: interviewUrl ?? application.interviewUrl, interviewAt: interviewAt ?? application.interviewAt }
            : {}),
        },
      });
    }

    await prisma.notification.create({
      data: {
        recipientId: application.userId,
        title:
          action === "ACCEPTED" ? "You're hired as a mentor!" :
          action === "REJECTED" ? "Mentor application update" :
          "Mentor application update",
        body:
          action === "ACCEPTED"
            ? `Congratulations — you are now a mentor for ${application.course.title}.`
            : action === "INTERVIEW_SCHEDULED"
              ? `Your interview for ${application.course.title} has been scheduled${interviewAt ? ` for ${new Date(interviewAt).toLocaleString()}` : ""}.`
              : `Your application for ${application.course.title} moved to ${action.replace("_", " ").toLowerCase()}.`,
        courseId: application.courseId,
      },
    });

    await sendEmail({
      to: application.user.email,
      subject: `Your EduAltTech mentor application — ${action.replace("_", " ").toLowerCase()}`,
      html: layout(
        "Application update",
        `Your mentor application for <strong>${application.course.title}</strong> is now <strong>${action.replace("_", " ").toLowerCase()}</strong>.`,
        "View your applications",
        `${process.env.APP_BASE_URL ?? "http://localhost:3000"}/dashboard/applications`,
      ),
    }).catch(() => false);

    audit(req.user!.id, `application.${action.toLowerCase()}`, "mentorApplication", application.id, {
      courseId: application.courseId,
      applicantId: application.userId,
    });

    const fresh = await prisma.mentorApplication.findUnique({ where: { id: application.id }, include: includeFull });
    res.json({ success: true, data: { application: fresh, mentorParticipantId } });
  },
);

// Resume download (private bucket → short-lived signed URL)
router.get("/:id/resume", requireAuth, async (req, res) => {
  const application = await prisma.mentorApplication.findUnique({ where: { id: req.params.id }, select: { userId: true, resumePath: true } });
  if (!application?.resumePath) throw ApiError.notFound("No resume on this application");
  if (application.userId !== req.user!.id && req.user!.role !== "ADMIN") throw ApiError.forbidden("Not your resume");
  const url = await signedUrl(application.resumePath);
  res.json({ success: true, data: { url } });
});

export default router;
