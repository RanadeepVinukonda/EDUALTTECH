import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { param } from "../../utils/params.js";
import { assertWithinRate, generateReply } from "./ai.service.js";

const router = Router();

// All AI routes require an account
router.use(requireAuth);

const sendSchema = z.object({
  chatId: z.string().cuid2().optional(),
  message: z.string().trim().min(1).max(4_000),
  save: z.boolean().optional(),
});

const MAX_CHATS_PER_USER = 200;

/**
 * POST /api/ai/chat
 * Body: { chatId?, message, save? }
 * Continues a chat or starts a new one. The assistant reply comes from a
 * real provider call; if no provider is configured the request fails with
 * a clear 503 rather than returning a fake answer.
 */
router.post("/chat", validate(sendSchema), async (req, res, next) => {
  try {
    const { chatId, message } = req.body as z.infer<typeof sendSchema>;
    assertWithinRate(req.user!.id);

    let chat = chatId
      ? await prisma.aiChat.findFirst({ where: { id: chatId, userId: req.user!.id, deletedAt: null } })
      : null;

    if (chatId && !chat) throw ApiError.notFound("Chat not found");

    if (!chat) {
      const count = await prisma.aiChat.count({ where: { userId: req.user!.id, deletedAt: null } });
      if (count >= MAX_CHATS_PER_USER) {
        throw ApiError.tooMany(`Chat limit reached (${MAX_CHATS_PER_USER}) — delete an old chat first`);
      }
      chat = await prisma.aiChat.create({ data: { userId: req.user!.id, title: message.slice(0, 60) } });
    }

    // Save the user turn and produce the assistant turn together so a
    // failed provider call cannot leave a dangling user message behind.
    const reply = await generateReply(message);

    await prisma.$transaction([
      prisma.aiMessage.create({ data: { chatId: chat.id, role: "user", content: message } }),
      prisma.aiMessage.create({ data: { chatId: chat.id, role: "assistant", content: reply } }),
      prisma.aiChat.update({ where: { id: chat.id }, data: { isSaved: true } }),
    ]);

    res.json({ success: true, data: { chatId: chat.id, reply } });
  } catch (err) {
    next(err);
  }
});

router.get("/chats", async (req, res, next) => {
  try {
    const q = z
      .object({ limit: z.coerce.number().int().min(1).max(100).default(50) })
      .parse(req.query);

    const chats = await prisma.aiChat.findMany({
      where: { userId: req.user!.id, deletedAt: null },
      orderBy: { updatedAt: "desc" },
      take: q.limit,
      select: { id: true, title: true, isSaved: true, createdAt: true, updatedAt: true },
    });
    res.json({ success: true, data: { chats } });
  } catch (err) {
    next(err);
  }
});

router.get("/chats/:id", async (req, res, next) => {
  try {
    const chat = await prisma.aiChat.findFirst({
      where: { id: param(req, "id"), userId: req.user!.id, deletedAt: null },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!chat) throw ApiError.notFound("Chat not found");
    res.json({ success: true, data: { chat } });
  } catch (err) {
    next(err);
  }
});

router.delete("/chats/:id", async (req, res, next) => {
  try {
    const result = await prisma.aiChat.updateMany({
      where: { id: param(req, "id"), userId: req.user!.id },
      data: { deletedAt: new Date() },
    });
    if (result.count === 0) throw ApiError.notFound("Chat not found");
    res.json({ success: true, data: { message: "Chat deleted" } });
  } catch (err) {
    next(err);
  }
});

export default router;