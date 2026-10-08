import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate, body } from "../../middlewares/validate.js";

const router = Router();

router.get("/", requireAuth, validate({ query: z.object({
  unreadOnly: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
}) }), async (req, res) => {
  const { unreadOnly, page, limit } = req.query as unknown as { unreadOnly?: boolean; page: number; limit: number };
  const where = { recipientId: req.user!.id, ...(unreadOnly ? { readAt: null } : {}) };

  const [total, unread, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { recipientId: req.user!.id, readAt: null } }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        sender: { select: { firstName: true, lastName: true, avatarUrl: true } },
        course: { select: { id: true, slug: true, title: true } },
      },
    }),
  ]);

  res.json({ success: true, data: { notifications, unread, total, page, limit, hasMore: page * limit < total } });
});

router.post("/read", requireAuth, validate({ body: z.object({ ids: z.array(z.string()).max(200).optional() }) }), async (req, res) => {
  const { ids } = body<{ ids?: string[] }>(req);
  const result = await prisma.notification.updateMany({
    where: { recipientId: req.user!.id, readAt: null, ...(ids && ids.length > 0 ? { id: { in: ids } } : {}) },
    data: { readAt: new Date() },
  });
  res.json({ success: true, data: { updated: result.count } });
});

export default router;
