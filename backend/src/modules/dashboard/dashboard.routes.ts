import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";

const router = Router();

/** One payload per role — learner, mentor, admin. Frontend renders what it needs. */
router.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const now = new Date();

  const [learning, mentoring, unreadNotifications, applications, pendingMentorApps] = await Promise.all([
    prisma.courseParticipant.findMany({
      where: { userId, role: "LEARNER", status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      include: {
        course: { select: { id: true, slug: true, title: true, thumbnailUrl: true, category: true } },
      },
    }),
    prisma.courseParticipant.findMany({
      where: { userId, role: "MENTOR", status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      include: {
        course: {
          select: {
            id: true, slug: true, title: true, thumbnailUrl: true, category: true, status: true,
            _count: { select: { participants: { where: { role: "LEARNER", status: "ACTIVE", mentorUserId: userId } } } },
          },
        },
      },
    }),
    prisma.notification.count({ where: { recipientId: userId, readAt: null } }),
    prisma.conversationMessage.count({
      where: { readAt: null, senderId: { not: userId }, conversation: { OR: [{ learnerUserId: userId }, { mentorUserId: userId }] } },
    }),
    prisma.mentorApplication.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, status: true, createdAt: true, course: { select: { id: true, slug: true, title: true } } },
    }),
  ]);

  const courseIds = [...learning.map((l) => l.courseId), ...mentoring.map((m) => m.courseId)];
  const upcomingMeetings = courseIds.length === 0 ? [] : await prisma.liveMeeting.findMany({
    where: { courseId: { in: courseIds }, scheduledAt: { gte: now } },
    orderBy: { scheduledAt: "asc" },
    take: 5,
    select: { id: true, title: true, scheduledAt: true, durationMin: true, meetingUrl: true, courseId: true,
      course: { select: { id: true, slug: true, title: true } } },
  });

  const mentorIds = [...new Set(learning.map((l) => l.mentorUserId).filter((id): id is string => !!id))];
  const mentorRows = mentorIds.length === 0
    ? []
    : await prisma.user.findMany({
        where: { id: { in: mentorIds } },
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      });
  const mentorMap = new Map(mentorRows.map((m) => [m.id, m]));

  res.json({
    success: true,
    data: {
      role: req.user!.role,
      learning: learning.map((l) => ({ ...l, mentor: l.mentorUserId ? (mentorMap.get(l.mentorUserId) ?? null) : null })),
      mentoring,
      upcomingMeetings,
      unreadNotifications,
      unreadMessages: applications,
      applications: pendingMentorApps,
    },
  });
});

export default router;
