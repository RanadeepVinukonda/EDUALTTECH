import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate, body } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const items = await prisma.wishlistItem.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: "desc" },
    include: {
      course: {
        select: { id: true, slug: true, title: true, description: true, category: true, pricePaise: true, currency: true, thumbnailUrl: true, status: true },
      },
    },
  });
  res.json({ success: true, data: { items } });
});

router.post("/:courseId", requireAuth, async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.courseId }, select: { id: true, status: true } });
  if (!course || course.status !== "PUBLISHED") throw ApiError.notFound("Course not found");

  const item = await prisma.wishlistItem.upsert({
    where: { userId_courseId: { userId: req.user!.id, courseId: course.id } },
    update: {},
    create: { userId: req.user!.id, courseId: course.id },
  });
  res.status(201).json({ success: true, data: { item } });
});

router.delete("/:courseId", requireAuth, async (req, res) => {
  await prisma.wishlistItem.deleteMany({
    where: { userId: req.user!.id, courseId: req.params.courseId },
  });
  res.json({ success: true, data: { ok: true } });
});

export default router;
