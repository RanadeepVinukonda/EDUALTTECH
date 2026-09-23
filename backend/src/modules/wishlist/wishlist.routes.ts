import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { ApiError } from "../../utils/ApiError.js";
import { param } from "../../utils/params.js";

const router = Router();

router.use(requireAuth);

// My saved courses — with the same published-course projection as the catalog.
router.get("/", async (req, res, next) => {
  try {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.id },
      include: {
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            thumbnailUrl: true,
            subject: true,
            gradeLevel: true,
            isPublished: true,
            teacher: { select: { name: true } },
            _count: { select: { enrollments: true, modules: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: {
        count: items.length,
        items: items
          .filter((i) => i.course.isPublished)
          .map((i) => ({ ...i.course, savedAt: i.createdAt })),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Add to wishlist — upsert makes a repeated tap a no-op, never a duplicate.
router.post("/:courseId", async (req, res, next) => {
  try {
    const course = await prisma.course.findUnique({ where: { id: param(req, "courseId") } });
    if (!course || !course.isPublished) throw ApiError.notFound("Course not found");

    await prisma.wishlistItem.upsert({
      where: { userId_courseId: { userId: req.user!.id, courseId: course.id } },
      update: {},
      create: { userId: req.user!.id, courseId: course.id },
    });

    res.status(201).json({ success: true, data: { saved: true } });
  } catch (err) {
    next(err);
  }
});

// Remove — quiet delete; removing something not saved is not an error.
router.delete("/:courseId", async (req, res, next) => {
  try {
    await prisma.wishlistItem.deleteMany({
      where: { userId: req.user!.id, courseId: param(req, "courseId") },
    });
    res.json({ success: true, data: { saved: false } });
  } catch (err) {
    next(err);
  }
});

export default router;