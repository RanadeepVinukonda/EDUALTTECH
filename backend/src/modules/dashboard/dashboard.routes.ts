import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";

const router = Router();

router.use(requireAuth);

/** GET /api/dashboard/me — personal learning metrics, streak, quiz scores, activity */
router.get("/me", async (req, res, next) => {
  try {
    const userId = req.user!.id;

    const [enrollments, quizAttempts, practiceAttempts, streak, activity, aiChats] = await Promise.all([
      prisma.enrollment.findMany({
        where: { studentId: userId },
        include: { course: { select: { id: true, title: true, slug: true, thumbnailUrl: true, subject: true } } },
        orderBy: { enrolledAt: "desc" },
      }),
      prisma.quizAttempt.findMany({
        where: { studentId: userId },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { quiz: { select: { title: true } } },
      }),
      prisma.practiceAttempt.groupBy({
        by: ["result"],
        where: { studentId: userId },
        _count: true,
      }),
      prisma.streak.findUnique({ where: { userId } }),
      prisma.activityLog.findMany({
        where: { userId },
        orderBy: { day: "desc" },
        take: 30,
      }),
      prisma.aiChat.count({ where: { userId, deletedAt: null } }),
    ]);

    const avgQuizScore =
      quizAttempts.length > 0 ? Math.round(quizAttempts.reduce((s, a) => s + a.score, 0) / quizAttempts.length) : 0;

    res.json({
      success: true,
      data: {
        enrollments,
        quizAttempts,
        practiceStats: practiceAttempts,
        avgQuizScore,
        streak: streak ?? { current: 0, longest: 0 },
        activity,
        aiChats,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
