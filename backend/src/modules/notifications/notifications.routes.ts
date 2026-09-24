import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";

const router = Router();

const sendSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(1).max(2_000),
  scope: z.enum(["ALL", "COURSE", "USER"]).default("ALL"),
  courseId: z.string().cuid2().optional(),
});

// Course owners/mentors and admins send notifications; everyone authenticated can read them
router.post("/", requireAuth, validate(sendSchema), async (req, res, next) => {
  try {
    const { title, body, scope, courseId } = req.body as z.infer<typeof sendSchema>;

    if (scope === "COURSE") {
      if (!courseId) throw ApiError.badRequest("courseId is required for COURSE scope");
      if (req.user!.role !== "ADMIN") {
        const [owns, mentors] = await Promise.all([
          prisma.course.findFirst({ where: { id: courseId, teacherId: req.user!.id }, select: { id: true } }),
          prisma.courseMentor.findFirst({ where: { courseId, mentorId: req.user!.id }, select: { id: true } }),
        ]);
        if (!owns && !mentors) throw ApiError.forbidden("You can only notify courses you teach");
      }
    } else if (courseId) {
      throw ApiError.badRequest("courseId is only allowed with COURSE scope");
    }

    const notification = await prisma.notification.create({
      data: { title, body, scope, courseId, senderId: req.user!.id },
    });

    res.status(201).json({ success: true, data: { notification } });
  } catch (err) {
    next(err);
  }
});

router.get("/", requireAuth, async (req, res, next) => {
  try {
    const where =
      req.user!.role === "ADMIN"
        ? {}
        : {
            OR: [
              { scope: "ALL" },
              { scope: "COURSE", course: { enrollments: { some: { studentId: req.user!.id } } } },
              { scope: "COURSE", senderId: req.user!.id },
              { senderId: req.user!.id },
            ],
          };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { sender: { select: { name: true } } },
    });

    res.json({ success: true, data: { notifications } });
  } catch (err) {
    next(err);
  }
});

export default router;
