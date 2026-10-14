import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate, body } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { getCourseAccess } from "../../lib/course-access.js";
import type { Role } from "@prisma/client";

const router = Router();

// Conversation access: a member of the thread, or course staff (a mentor of the
// course can message any of its learners) — never an unrelated user or plain admin.
async function memberConversation(conversationId: string, user: { id: string; role: Role }) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      course: { select: { id: true, slug: true, title: true, thumbnailUrl: true } },
      learner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      mentor: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });
  if (!conversation) throw ApiError.notFound("Conversation not found");
  const isMember = conversation.learnerUserId === user.id || conversation.mentorUserId === user.id;
  if (!isMember) {
    const access = await getCourseAccess(conversation.courseId, user);
    if (!access.isStaff) throw ApiError.forbidden("Not a member of this conversation");
  }
  return conversation;
}

// Find-or-create the thread between the calling mentor and a learner in a course.
router.post(
  "/conversations",
  requireAuth,
  validate({ body: z.object({ courseId: z.string().min(1), learnerUserId: z.string().min(1) }) }),
  async (req, res) => {
    const { courseId, learnerUserId } = body<{ courseId: string; learnerUserId: string }>(req);

    const access = await getCourseAccess(courseId, req.user!);
    if (!access.isStaff) throw ApiError.forbidden("Only course staff can message learners");

    const participant = await prisma.courseParticipant.findUnique({
      where: { courseId_userId: { courseId, userId: learnerUserId } },
      select: { role: true, status: true, mentorUserId: true },
    });
    if (!participant || participant.role !== "LEARNER" || participant.status !== "ACTIVE") {
      throw ApiError.badRequest("That learner is not active in this course");
    }

    const conversation = await prisma.conversation.upsert({
      where: { courseId_learnerUserId: { courseId, learnerUserId } },
      update: {},
      create: { courseId, learnerUserId, mentorUserId: participant.mentorUserId ?? req.user!.id },
      include: {
        course: { select: { id: true, slug: true, title: true, thumbnailUrl: true } },
        learner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
        mentor: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      },
    });

    res.status(201).json({ success: true, data: { conversation: { ...conversation, lastMessage: null, unreadCount: 0 } } });
  },
);

router.get("/conversations", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const conversations = await prisma.conversation.findMany({
    where: { OR: [{ learnerUserId: userId }, { mentorUserId: userId }] },
    orderBy: { createdAt: "desc" },
    include: {
      course: { select: { id: true, slug: true, title: true, thumbnailUrl: true } },
      learner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      mentor: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, senderId: true },
      },
    },
  });

  const withMeta = await Promise.all(
    conversations.map(async (c) => {
      const unread = await prisma.conversationMessage.count({
        where: { conversationId: c.id, senderId: { not: userId }, readAt: null },
      });
      const { messages, ...rest } = c;
      return { ...rest, lastMessage: messages[0] ?? null, unreadCount: unread };
    }),
  );

  res.json({ success: true, data: { conversations: withMeta } });
});

router.get("/conversations/:id/messages", requireAuth, validate({ query: z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
}) }), async (req, res) => {
  const conversation = await memberConversation(req.params.id, req.user!);
  const { cursor, limit } = req.query as unknown as { cursor?: string; limit: number };

  const messages = await prisma.conversationMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
  });
  const hasMore = messages.length > limit;
  const page = hasMore ? messages.slice(0, limit) : messages;

  // Reading marks the counterpart's messages as read.
  await prisma.conversationMessage.updateMany({
    where: { conversationId: conversation.id, senderId: { not: req.user!.id }, readAt: null },
    data: { readAt: new Date() },
  });

  res.json({ success: true, data: { messages: page, hasMore, conversation } });
});

router.post(
  "/conversations/:id/messages",
  requireAuth,
  validate({ body: z.object({ body: z.string().trim().min(1).max(4000) }) }),
  async (req, res) => {
    const conversation = await memberConversation(req.params.id, req.user!);
    const { body: text } = body<{ body: string }>(req);

    const message = await prisma.conversationMessage.create({
      data: { conversationId: conversation.id, senderId: req.user!.id, body: text },
      include: { sender: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } } },
    });

    const counterpartId = conversation.learnerUserId === req.user!.id ? conversation.mentorUserId : conversation.learnerUserId;
    await prisma.notification.create({
      data: {
        recipientId: counterpartId,
        senderId: req.user!.id,
        title: "New message",
        body: text.slice(0, 140),
        courseId: conversation.courseId,
      },
    });

    res.status(201).json({ success: true, data: { message } });
  },
);

export default router;
