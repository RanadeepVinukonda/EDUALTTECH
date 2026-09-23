import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { param } from "../../utils/params.js";
import type { Role } from "@prisma/client";

const router = Router();

router.use(requireAuth);

type AuthUser = { id: string; role: Role };

/** Anyone with a seat in the course's teaching team or an active enrollment. */
async function assertCourseAccess(courseId: string, user: AuthUser): Promise<void> {
  if (user.role === "ADMIN") return;
  const [owns, mentors, enrolled] = await Promise.all([
    prisma.course.findFirst({ where: { id: courseId, teacherId: user.id }, select: { id: true } }),
    prisma.courseMentor.findFirst({ where: { courseId, mentorId: user.id }, select: { id: true } }),
    prisma.enrollment.findFirst({
      where: { courseId, studentId: user.id, status: "ACTIVE" },
      select: { id: true },
    }),
  ]);
  if (!owns && !mentors && !enrolled) {
    throw ApiError.forbidden("You are not enrolled in, mentoring or teaching this course");
  }
}

/** Only the owner/mentors/admins can schedule; learners only read. */
async function assertCanManage(courseId: string, user: AuthUser): Promise<void> {
  if (user.role === "ADMIN") return;
  const [owns, mentors] = await Promise.all([
    prisma.course.findFirst({ where: { id: courseId, teacherId: user.id }, select: { id: true } }),
    prisma.courseMentor.findFirst({ where: { courseId, mentorId: user.id }, select: { id: true } }),
  ]);
  if (!owns && !mentors) throw ApiError.forbidden("Only the course owner, mentors or admins can schedule meetings");
}

const createSchema = z.object({
  courseId: z.string().min(1).max(40),
  title: z.string().trim().min(3).max(160),
  description: z.string().trim().max(1_000).optional(),
  scheduledAt: z.coerce.date().refine((d) => d.getTime() > Date.now() - 60_000, "Meeting must be scheduled in the future"),
  durationMin: z.number().int().min(15).max(480).default(60),
  meetingUrl: z.string().url().max(600),
  chapterId: z.string().min(1).max(40).optional(),
});

const updateSchema = createSchema.omit({ courseId: true }).partial();

// Upcoming meetings for a course (enrolled students, mentors, owner, admin).
router.get("/course/:courseId", async (req, res, next) => {
  try {
    const courseId = param(req, "courseId");
    const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true, isPublished: true } });
    if (!course) throw ApiError.notFound("Course not found");
    // Learners who haven't enrolled yet can't see the schedule — it's part
    // of the course experience, not the public catalog.
    await assertCourseAccess(courseId, req.user!);

    const meetings = await prisma.liveMeeting.findMany({
      where: { courseId, scheduledAt: { gt: new Date() } },
      orderBy: { scheduledAt: "asc" },
      take: 20,
      select: {
        id: true,
        title: true,
        description: true,
        scheduledAt: true,
        durationMin: true,
        meetingUrl: true,
        chapter: { select: { id: true, title: true } },
        createdBy: { select: { name: true } },
      },
    });

    res.json({ success: true, data: { meetings } });
  } catch (err) {
    next(err);
  }
});

router.post("/", validate(createSchema), async (req, res, next) => {
  try {
    const data = req.body as z.infer<typeof createSchema>;
    await assertCanManage(data.courseId, req.user!);

    if (data.chapterId) {
      const chapter = await prisma.courseChapter.findUnique({
        where: { id: data.chapterId },
        include: { courseMentor: { select: { courseId: true } } },
      });
      if (!chapter || chapter.courseMentor.courseId !== data.courseId) {
        throw ApiError.badRequest("That chapter does not belong to this course");
      }
    }

    const meeting = await prisma.liveMeeting.create({
      data: {
        courseId: data.courseId,
        chapterId: data.chapterId,
        title: data.title,
        description: data.description,
        scheduledAt: data.scheduledAt,
        durationMin: data.durationMin,
        meetingUrl: data.meetingUrl,
        createdById: req.user!.id,
      },
    });

    // COURSE-scope → the notifications list surfaces it to every enrolled student.
    await prisma.notification.create({
      data: {
        title: "Live class scheduled",
        body: `${data.title} — ${new Date(data.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`,
        scope: "COURSE",
        courseId: data.courseId,
        senderId: req.user!.id,
      },
    });

    res.status(201).json({ success: true, data: { meeting } });
  } catch (err) {
    next(err);
  }
});

async function requireManageableMeeting(meetingId: string, user: AuthUser): Promise<{ id: string }> {
  const meeting = await prisma.liveMeeting.findUnique({ where: { id: meetingId }, select: { id: true, courseId: true } });
  if (!meeting) throw ApiError.notFound("Meeting not found");
  await assertCanManage(meeting.courseId, user);
  return meeting;
}

router.patch("/:id", validate(updateSchema), async (req, res, next) => {
  try {
    await requireManageableMeeting(param(req, "id"), req.user!);
    const meeting = await prisma.liveMeeting.update({
      where: { id: param(req, "id") },
      data: req.body as z.infer<typeof updateSchema>,
    });
    res.json({ success: true, data: { meeting } });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await requireManageableMeeting(param(req, "id"), req.user!);
    await prisma.liveMeeting.delete({ where: { id: param(req, "id") } });
    res.json({ success: true, data: { message: "Meeting cancelled" } });
  } catch (err) {
    next(err);
  }
});

export default router;