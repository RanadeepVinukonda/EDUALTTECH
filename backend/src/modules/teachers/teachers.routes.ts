import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { param } from "../../utils/params.js";
import { applicationStatusEmail } from "../../lib/email.js";
import { audit } from "../../lib/audit.js";
import { logger } from "../../utils/logger.js";

const router = Router();

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
    const existing = await prisma.teacherApplication.findUnique({ where: { userId: req.user!.id } });
    if (existing && existing.status === "PENDING") {
      throw ApiError.conflict("Your application is already under review");
    }

    const body = req.body as z.infer<typeof applySchema>;
    if (body.courseId) {
      const course = await prisma.course.findUnique({ where: { id: body.courseId } });
      if (!course) throw ApiError.badRequest("That course does not exist");

      // Anyone can learn and teach here, but not both seats in the same course.
      const alreadyMentor = await prisma.courseMentor.findUnique({
        where: { courseId_mentorId: { courseId: body.courseId, mentorId: req.user!.id } },
      });
      if (alreadyMentor) throw ApiError.conflict("You are already a mentor for this course");
    }

    const application = await prisma.teacherApplication.upsert({
      where: { userId: req.user!.id },
      update: { status: "PENDING", reviewedAt: null, reviewedBy: null, reviewNote: null, meetingLink: null, ...body },
      create: { userId: req.user!.id, ...body },
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
    const application = await prisma.teacherApplication.findUnique({ where: { userId: req.user!.id } });
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
        course: { select: { id: true, title: true, slug: true } },
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
    if (status === "INTERVIEW" && !meetingLink && !app.meetingLink) {
      throw ApiError.badRequest("Add an interview meeting link before moving to interview");
    }

    const [updated] = await prisma.$transaction([
      prisma.teacherApplication.update({
        where: { id: app.id },
        data: { status, reviewNote, meetingLink, reviewedBy: req.user!.id, reviewedAt: new Date() },
      }),
      // Approval attaches them as a provider for the course they applied for.
      // No role change: they are still a normal USER who can also learn.
      ...(status === "APPROVED" && app.courseId
        ? [
            prisma.courseMentor.upsert({
              where: { courseId_mentorId: { courseId: app.courseId, mentorId: app.userId } },
              update: {},
              create: { courseId: app.courseId, mentorId: app.userId },
            }),
          ]
        : []),
    ]);

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
