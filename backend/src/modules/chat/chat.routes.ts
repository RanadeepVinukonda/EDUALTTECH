import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate, body } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";

const router = Router();

// Conversation access: only the learner or mentor on the thread — never an admin.
async function memberConversation(conversationId: string, userId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      course: { select: { id: true, slug: true, title: true, thumbnailUrl: true } },
      learner: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
      mentor: { select: { id: true, firstName: true, lastName: true, avatarUrl: true } },
    },
  });
  if (!conversation) throw ApiError.notFound("Conversation not found");
  if (conversation.learnerUserId !== userId && conversation.mentorUserId !== userId) {
    throw ApiError.forbidden("Not a member of this conversation");
  }
  return conversation;
}

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
  const conversation = await memberConversation(req.params.id, req.user!.id);
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
    const conversation = await memberConversation(req.params.id, req.user!.id);
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
