import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { codeLimiter } from "../../middlewares/rate-limit.js";
import { validate, body } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { audit } from "../../lib/audit.js";

const router = Router();

// Public — rate-limited. No auth, honeypot-style length limits instead of CAPTCHA.
router.post(
  "/",
  codeLimiter,
  validate({
    body: z.object({
      name: z.string().trim().min(2).max(120),
      email: z.string().trim().toLowerCase().email(),
      phone: z.string().trim().max(20).nullable().optional(),
      subject: z.string().trim().max(200).nullable().optional(),
      body: z.string().trim().min(5).max(5000),
    }),
  }),
  async (req, res) => {
    const input = body<{ name: string; email: string; phone?: string | null; subject?: string | null; body: string }>(req);
    const message = await prisma.contactMessage.create({ data: input });
    res.status(201).json({ success: true, data: { id: message.id } });
  },
);

router.get("/", requireAuth, requireRole("ADMIN"), validate({ query: z.object({
  filter: z.enum(["all", "unread", "handled"]).default("all"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
}) }), async (req, res) => {
  const { filter, page, limit } = req.query as unknown as { filter: "all" | "unread" | "handled"; page: number; limit: number };
  const where = filter === "unread" ? { isRead: false } : filter === "handled" ? { handledAt: { not: null } } : {};
  const [total, messages] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
  ]);
  res.json({ success: true, data: { messages, total, page, limit, hasMore: page * limit < total } });
});

router.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN"),
  validate({ body: z.object({ isRead: z.boolean().optional(), handled: z.boolean().optional() }) }),
  async (req, res) => {
    const { isRead, handled } = body<{ isRead?: boolean; handled?: boolean }>(req);
    const existing = await prisma.contactMessage.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Message not found");

    const message = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: {
        ...(isRead !== undefined ? { isRead } : {}),
        ...(handled !== undefined ? { handledById: handled ? req.user!.id : null, handledAt: handled ? new Date() : null, isRead: true } : {}),
      },
    });
    audit(req.user!.id, "contact.updated", "contactMessage", message.id, { isRead, handled });
    res.json({ success: true, data: { message } });
  },
);

export default router;
