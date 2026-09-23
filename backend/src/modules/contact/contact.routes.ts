import { Router } from "express";
import { z } from "zod";
import rateLimit from "express-rate-limit";
import { prisma } from "../../lib/prisma.js";
import { validate } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";

const router = Router();

// Public form — tightly rate limited per IP (5 messages / 15 min).
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many messages — please wait before sending another." } },
});

const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email().max(160),
  school: z.string().trim().max(120).optional(),
  subject: z.string().trim().max(140).optional(),
  body: z.string().trim().min(10).max(4_000),
  // Honeypot: bots fill hidden fields. Presence of any value = bot, drop silently.
  website: z.string().max(160).optional(),
});

router.post("/", contactLimiter, validate(contactSchema), async (req, res, next) => {
  try {
    const { website, ...data } = req.body as z.infer<typeof contactSchema>;
    if (website) {
      // Pretend success without storing anything.
      res.status(201).json({ success: true, data: { id: "spam-filtered", message: "Thanks! Our team will reach out shortly." } });
      return;
    }

    const message = await prisma.contactMessage.create({ data });
    res.status(201).json({ success: true, data: { id: message.id, message: "Thanks! Our team will reach out shortly." } });
  } catch (err) {
    next(err);
  }
});

export default router;