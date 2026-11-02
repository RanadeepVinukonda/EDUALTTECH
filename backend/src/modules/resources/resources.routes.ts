import { Router, type Request } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { uploadPrivate, removePrivate, signedUrl, assertUploadable, contentTypeFor } from "../../lib/storage.js";
import { requireAuth, requireRole, optionalAuth } from "../../middlewares/auth.js";
import { validate, body } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { audit } from "../../lib/audit.js";
import { getCourseAccess } from "../../lib/course-access.js";

const router = Router();

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

// ────────────────────────────────────────────────────────────────────
// Resource Library (Categories & Subcategories)
// ────────────────────────────────────────────────────────────────────

router.get("/categories", async (_req, res) => {
  const categories = await prisma.resourceCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      subcategories: { orderBy: { order: "asc" } },
      _count: { select: { articles: { where: { isPublished: true } } } },
    },
  });

  res.json({
    success: true,
    data: {
      categories: categories.map((c) => ({
        ...c,
        articleCount: c._count.articles,
      })),
    },
  });
});

// Public catalog endpoint for header navigation and category dropdowns
router.get("/catalog", async (_req, res) => {
  const articles = await prisma.resourceArticle.findMany({
    where: { isPublished: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      subcategory: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const resources = articles.map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    description: a.description,
    category: a.category.name,
    domain: a.category.name,
    thumbnailUrl: a.coverUrl,
    updatedAt: a.updatedAt.toISOString(),
    chapterCount: 1,
    topicCount: 1,
    lessonCount: 1,
  }));

  res.json({ success: true, data: { resources } });
});

// Public featured articles endpoint
router.get("/featured", async (_req, res) => {
  const featured = await prisma.resourceArticle.findMany({
    where: { isPublished: true, isFeatured: true },
    take: 6,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      difficulty: true,
      estimatedMinutes: true,
      coverUrl: true,
      tags: true,
      views: true,
      createdAt: true,
      updatedAt: true,
      category: { select: { id: true, name: true, slug: true, icon: true } },
      subcategory: { select: { id: true, name: true, slug: true } },
    },
  });

  res.json({ success: true, data: { featured } });
});

// Admin category management
router.post(
  "/categories",
  requireAuth,
  requireRole("ADMIN"),
  validate({
    body: z.object({
      name: z.string().trim().min(2).max(100),
      slug: z.string().trim().min(2).max(100).optional(),
      description: z.string().trim().max(1000).nullable().optional(),
      icon: z.string().trim().max(50).nullable().optional(),
      order: z.number().int().min(0).default(0),
    }),
  }),
  async (req, res) => {
    const input = body<{ name: string; slug?: string; description?: string | null; icon?: string | null; order: number }>(req);
    let slug = input.slug ? slugify(input.slug) : slugify(input.name);
    if (!slug) slug = `category-${Date.now().toString(36)}`;

    const existing = await prisma.resourceCategory.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const category = await prisma.resourceCategory.create({
      data: { name: input.name, slug, description: input.description ?? null, icon: input.icon ?? null, order: input.order },
    });
    audit(req.user!.id, "resourceCategory.created", "resourceCategory", category.id, { name: category.name });
    res.status(201).json({ success: true, data: { category } });
  },
);

router.patch(
  "/categories/:id",
  requireAuth,
  requireRole("ADMIN"),
  validate({
    body: z.object({
      name: z.string().trim().min(2).max(100).optional(),
      slug: z.string().trim().min(2).max(100).optional(),
      description: z.string().trim().max(1000).nullable().optional(),
      icon: z.string().trim().max(50).nullable().optional(),
      order: z.number().int().min(0).optional(),
    }),
  }),
  async (req, res) => {
    const input = body<Record<string, unknown>>(req);
    const category = await prisma.resourceCategory.update({
      where: { id: req.params.id },
      data: input as never,
    });
    audit(req.user!.id, "resourceCategory.updated", "resourceCategory", category.id);
    res.json({ success: true, data: { category } });
  },
);

router.delete("/categories/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  await prisma.resourceCategory.delete({ where: { id: req.params.id } });
  audit(req.user!.id, "resourceCategory.deleted", "resourceCategory", req.params.id);
  res.json({ success: true, data: { ok: true } });
});

// Admin subcategory management
router.post(
  "/subcategories",
  requireAuth,
  requireRole("ADMIN"),
  validate({
    body: z.object({
      categoryId: z.string().min(1),
      name: z.string().trim().min(2).max(100),
      slug: z.string().trim().min(2).max(100).optional(),
      description: z.string().trim().max(1000).nullable().optional(),
      order: z.number().int().min(0).default(0),
    }),
  }),
  async (req, res) => {
    const input = body<{ categoryId: string; name: string; slug?: string; description?: string | null; order: number }>(req);
    let slug = input.slug ? slugify(input.slug) : slugify(input.name);
    if (!slug) slug = `sub-${Date.now().toString(36)}`;

    const existing = await prisma.resourceSubcategory.findUnique({
      where: { categoryId_slug: { categoryId: input.categoryId, slug } },
    });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const subcategory = await prisma.resourceSubcategory.create({
      data: { categoryId: input.categoryId, name: input.name, slug, description: input.description ?? null, order: input.order },
    });
    audit(req.user!.id, "resourceSubcategory.created", "resourceSubcategory", subcategory.id, { name: subcategory.name });
    res.status(201).json({ success: true, data: { subcategory } });
  },
);

router.delete("/subcategories/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  await prisma.resourceSubcategory.delete({ where: { id: req.params.id } });
  audit(req.user!.id, "resourceSubcategory.deleted", "resourceSubcategory", req.params.id);
  res.json({ success: true, data: { ok: true } });
});

// ────────────────────────────────────────────────────────────────────
// Resource Library (Articles & Tutorials)
// ────────────────────────────────────────────────────────────────────

router.get("/library", optionalAuth, validate({
  query: z.object({
    q: z.string().trim().max(120).optional(),
    category: z.string().trim().optional(),
    subcategory: z.string().trim().optional(),
    difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).optional(),
    tag: z.string().trim().optional(),
    sort: z.enum(["newest", "views", "popular"]).default("newest"),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(12),
  }),
}), async (req, res) => {
  const { q, category, subcategory, difficulty, tag, sort, page, limit } = req.query as unknown as {
    q?: string; category?: string; subcategory?: string; difficulty?: string; tag?: string; sort: string; page: number; limit: number;
  };

  const where = {
    isPublished: true,
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            { tags: { has: q } },
          ],
        }
      : {}),
    ...(category ? { OR: [{ categoryId: category }, { category: { slug: category } }] } : {}),
    ...(subcategory ? { OR: [{ subcategoryId: subcategory }, { subcategory: { slug: subcategory } }] } : {}),
    ...(difficulty ? { difficulty } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
  };

  const orderBy =
    sort === "views" || sort === "popular" ? { views: "desc" as const } : { createdAt: "desc" as const };

  const [total, articles, featured] = await Promise.all([
    prisma.resourceArticle.count({ where }),
    prisma.resourceArticle.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        difficulty: true,
        estimatedMinutes: true,
        coverUrl: true,
        tags: true,
        views: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { id: true, name: true, slug: true, icon: true } },
        subcategory: { select: { id: true, name: true, slug: true } },
        author: { select: { firstName: true, lastName: true, avatarUrl: true } },
      },
    }),
    page === 1
      ? prisma.resourceArticle.findMany({
          where: { isPublished: true, isFeatured: true },
          take: 4,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            difficulty: true,
            estimatedMinutes: true,
            coverUrl: true,
            tags: true,
            views: true,
            category: { select: { id: true, name: true, slug: true, icon: true } },
          },
        })
      : [],
  ]);

  res.json({
    success: true,
    data: {
      articles,
      total,
      page,
      limit,
      hasMore: page * limit < total,
      featured,
    },
  });
});

// Single Article / Tutorial Reading View
router.get("/article/:slug", optionalAuth, async (req, res) => {
  const article = await prisma.resourceArticle.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: { select: { id: true, name: true, slug: true, icon: true } },
      subcategory: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, firstName: true, lastName: true, avatarUrl: true, bio: true } },
      relatedCourse: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          thumbnailUrl: true,
          pricePaise: true,
          level: true,
          category: true,
        },
      },
    },
  });

  if (!article) throw ApiError.notFound("Resource tutorial not found");
  const isAdmin = req.user?.role === "ADMIN";
  if (!article.isPublished && !isAdmin) throw ApiError.notFound("Resource tutorial not found");

  // Increment views in background
  prisma.resourceArticle.update({
    where: { id: article.id },
    data: { views: { increment: 1 } },
  }).catch(() => undefined);

  // Check if bookmarked
  let isBookmarked = false;
  if (req.user) {
    const bookmark = await prisma.resourceBookmark.findUnique({
      where: { userId_articleId: { userId: req.user.id, articleId: article.id } },
    });
    isBookmarked = Boolean(bookmark);
  }

  // Previous and Next tutorial in the same subcategory or category
  const [prev, next, related] = await Promise.all([
    prisma.resourceArticle.findFirst({
      where: {
        categoryId: article.categoryId,
        isPublished: true,
        createdAt: { lt: article.createdAt },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, slug: true, title: true },
    }),
    prisma.resourceArticle.findFirst({
      where: {
        categoryId: article.categoryId,
        isPublished: true,
        createdAt: { gt: article.createdAt },
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, slug: true, title: true },
    }),
    prisma.resourceArticle.findMany({
      where: {
        categoryId: article.categoryId,
        id: { not: article.id },
        isPublished: true,
      },
      take: 4,
      orderBy: { views: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        description: true,
        difficulty: true,
        estimatedMinutes: true,
        coverUrl: true,
      },
    }),
  ]);

  res.json({
    success: true,
    data: {
      article,
      isBookmarked,
      prev,
      next,
      related,
    },
  });
});

// Bookmark / Unbookmark
router.post("/article/:id/bookmark", requireAuth, async (req, res) => {
  const articleId = req.params.id;
  const userId = req.user!.id;

  const existing = await prisma.resourceBookmark.findUnique({
    where: { userId_articleId: { userId, articleId } },
  });

  if (existing) {
    await prisma.resourceBookmark.delete({ where: { id: existing.id } });
    res.json({ success: true, data: { bookmarked: false } });
  } else {
    await prisma.resourceBookmark.create({ data: { userId, articleId } });
    res.json({ success: true, data: { bookmarked: true } });
  }
});

router.get("/bookmarks/mine", requireAuth, async (req, res) => {
  const bookmarks = await prisma.resourceBookmark.findMany({
    where: { userId: req.user!.id },
    include: {
      article: {
        select: {
          id: true,
          slug: true,
          title: true,
          description: true,
          difficulty: true,
          estimatedMinutes: true,
          coverUrl: true,
          category: { select: { name: true, slug: true } },
          updatedAt: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  res.json({
    success: true,
    data: { bookmarks: bookmarks.map((b) => b.article) },
  });
});

// Admin Article Management
const articleBody = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().min(5).max(1000),
  content: z.string().min(10).max(500_000),
  categoryId: z.string().min(1),
  subcategoryId: z.string().nullable().optional(),
  difficulty: z.enum(["Beginner", "Intermediate", "Advanced"]).default("Beginner"),
  estimatedMinutes: z.number().int().min(1).max(240).default(5),
  coverUrl: z.string().url().nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  isPublished: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  relatedCourseId: z.string().nullable().optional(),
});

router.post("/articles", requireAuth, requireRole("ADMIN"), validate({ body: articleBody }), async (req, res) => {
  const input = body<z.infer<typeof articleBody>>(req);
  let slug = input.slug ? slugify(input.slug) : slugify(input.title);
  if (!slug) slug = `article-${Date.now().toString(36)}`;

  const existing = await prisma.resourceArticle.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Date.now().toString(36)}`;

  const article = await prisma.resourceArticle.create({
    data: {
      ...input,
      slug,
      authorId: req.user!.id,
    },
  });

  audit(req.user!.id, "resourceArticle.created", "resourceArticle", article.id, { title: article.title });
  res.status(201).json({ success: true, data: { article } });
});

router.patch(
  "/articles/:id",
  requireAuth,
  requireRole("ADMIN"),
  validate({ body: articleBody.partial() }),
  async (req, res) => {
    const input = body<Record<string, unknown>>(req);
    const existing = await prisma.resourceArticle.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound("Article not found");

    if (input.title && !input.slug && input.title !== existing.title) {
      let nextSlug = slugify(input.title as string);
      const conflict = await prisma.resourceArticle.findUnique({ where: { slug: nextSlug } });
      if (conflict && conflict.id !== existing.id) nextSlug = `${nextSlug}-${Date.now().toString(36)}`;
      input.slug = nextSlug;
    }

    const article = await prisma.resourceArticle.update({
      where: { id: req.params.id },
      data: input as never,
    });

    audit(req.user!.id, "resourceArticle.updated", "resourceArticle", article.id);
    res.json({ success: true, data: { article } });
  },
);

router.delete("/articles/:id", requireAuth, requireRole("ADMIN"), async (req, res) => {
  await prisma.resourceArticle.delete({ where: { id: req.params.id } });
  audit(req.user!.id, "resourceArticle.deleted", "resourceArticle", req.params.id);
  res.json({ success: true, data: { ok: true } });
});

router.get("/admin/articles", requireAuth, requireRole("ADMIN"), validate({
  query: z.object({
    q: z.string().trim().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
}), async (req, res) => {
  const { q, page, limit } = req.query as unknown as { q?: string; page: number; limit: number };
  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, articles] = await Promise.all([
    prisma.resourceArticle.count({ where }),
    prisma.resourceArticle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { id: true, name: true } },
        subcategory: { select: { id: true, name: true } },
      },
    }),
  ]);

  res.json({ success: true, data: { articles, total, page, limit, hasMore: page * limit < total } });
});

// ────────────────────────────────────────────────────────────────────
// Legacy / Course File Resource Endpoints (Attachments & Downloads)
// ────────────────────────────────────────────────────────────────────

const resourceSelect = {
  id: true, title: true, description: true, kind: true, url: true, storagePath: true,
  fileSizeBytes: true, mimeType: true, downloads: true, isPublished: true, createdAt: true,
  courseId: true, topicId: true, lessonId: true, ownerId: true,
  owner: { select: { firstName: true, lastName: true } },
  course: { select: { id: true, slug: true, title: true } },
} as const;

async function assertResourceRead(
  resource: { id: string; courseId: string | null; ownerId: string; isPublished: boolean },
  user: { id: string; role: string },
) {
  if (user.role === "ADMIN" || resource.ownerId === user.id) return;
  if (resource.courseId) {
    const access = await getCourseAccess(resource.courseId, user as never);
    if (!access.canRead) throw ApiError.forbidden("You are not part of this course");
    if (!resource.isPublished && !access.isStaff) throw ApiError.notFound("Resource not found");
    return;
  }
  if (!resource.isPublished) throw ApiError.notFound("Resource not found");
}

router.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const myCourseIds = (
    await prisma.courseParticipant.findMany({
      where: { userId, status: "ACTIVE" },
      select: { courseId: true },
    })
  ).map((p) => p.courseId);

  const resources = await prisma.resource.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { courseId: null, isPublished: true },
        ...(myCourseIds.length > 0 ? [{ courseId: { in: myCourseIds }, isPublished: true }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 200,
    select: resourceSelect,
  });

  res.json({ success: true, data: { resources } });
});

router.get("/:id", requireAuth, async (req, res) => {
  const resource = await prisma.resource.findUnique({ where: { id: req.params.id }, select: resourceSelect });
  if (!resource) throw ApiError.notFound("Resource not found");
  await assertResourceRead(resource, req.user!);

  const downloadUrl = resource.storagePath ? await signedUrl(resource.storagePath) : resource.url;
  res.json({ success: true, data: { resource: { ...resource, storagePath: undefined, downloadUrl } } });
});

router.get("/:id/download", requireAuth, async (req, res) => {
  const resource = await prisma.resource.findUnique({ where: { id: req.params.id }, select: resourceSelect });
  if (!resource) throw ApiError.notFound("Resource not found");
  await assertResourceRead(resource, req.user!);

  const downloadUrl = resource.storagePath ? await signedUrl(resource.storagePath, 300) : resource.url;
  await prisma.resource.update({ where: { id: resource.id }, data: { downloads: { increment: 1 } } });
  res.json({ success: true, data: { downloadUrl } });
});

router.post(
  "/",
  requireAuth,
  validate({
    body: z.object({
      title: z.string().trim().min(2).max(160),
      description: z.string().trim().max(2000).nullable().optional(),
      kind: z.string().trim().max(20).default("pdf"),
      courseId: z.string().nullable().optional(),
      topicId: z.string().nullable().optional(),
      lessonId: z.string().nullable().optional(),
      linkUrl: z.string().url().nullable().optional(),
      file: z.object({ name: z.string().min(1).max(200), type: z.string().min(3), data: z.string().min(16) }).nullable().optional(),
    }),
  }),
  async (req, res) => {
    const input = body<{
      title: string; description?: string | null; kind: string;
      courseId?: string | null; topicId?: string | null; lessonId?: string | null; linkUrl?: string | null;
      file?: { name: string; type: string; data: string } | null;
    }>(req);

    if (input.lessonId) {
      const lesson = await prisma.lesson.findUnique({ where: { id: input.lessonId }, select: { courseId: true, topicId: true } });
      if (!lesson) throw ApiError.badRequest("Lesson not found");
      if (input.courseId && lesson.courseId !== input.courseId) {
        throw ApiError.badRequest("Lesson does not belong to the selected course");
      }
      input.courseId = lesson.courseId;
      input.topicId = lesson.topicId;
    }

    if (input.topicId) {
      const topic = await prisma.topic.findUnique({ where: { id: input.topicId }, select: { courseId: true } });
      if (!topic) throw ApiError.badRequest("Topic not found");
      if (input.courseId && topic.courseId !== input.courseId) {
        throw ApiError.badRequest("Topic does not belong to the selected course");
      }
      if (!input.courseId) input.courseId = topic.courseId;
    }

    if (input.courseId) {
      const access = await getCourseAccess(input.courseId, req.user!);
      if (!access.isStaff) throw ApiError.forbidden("Mentor or course-owner access required for course resources");
    }

    let storagePath: string | null = null;
    let fileSizeBytes: number | null = null;
    let mimeType: string | null = null;

    if (input.file) {
      const bytes = Buffer.from(input.file.data, "base64");
      assertUploadable(input.file.name, bytes.length);
      storagePath = await uploadPrivate(input.courseId ? `courses/${input.courseId}` : "resources", input.file.name, bytes, contentTypeFor(input.file.name));
      fileSizeBytes = bytes.length;
      mimeType = contentTypeFor(input.file.name);
    }

    const resource = await prisma.resource.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        kind: input.kind,
        courseId: input.courseId ?? null,
        topicId: input.topicId ?? null,
        lessonId: input.lessonId ?? null,
        url: input.linkUrl ?? null,
        storagePath,
        fileSizeBytes,
        mimeType,
        ownerId: req.user!.id,
      },
      select: resourceSelect,
    });

    audit(req.user!.id, "resource.created", "resource", resource.id, { courseId: input.courseId ?? null });
    res.status(201).json({ success: true, data: { resource } });
  },
);

router.delete("/:id", requireAuth, async (req: Request<{ id: string }>, res) => {
  const existing = await prisma.resource.findUnique({ where: { id: req.params.id }, select: { ownerId: true, courseId: true, storagePath: true } });
  if (!existing) throw ApiError.notFound("Resource not found");
  const isOwner = existing.ownerId === req.user!.id;
  if (!isOwner && req.user!.role !== "ADMIN") {
    if (existing.courseId) {
      const access = await getCourseAccess(existing.courseId, req.user!);
      if (!access.isStaff) throw ApiError.forbidden("Only the owner or course staff can delete this");
    } else {
      throw ApiError.forbidden("Only the owner can delete this");
    }
  }
  await prisma.resource.delete({ where: { id: req.params.id } });
  if (existing.storagePath) await removePrivate(existing.storagePath).catch(() => undefined);
  audit(req.user!.id, "resource.deleted", "resource", req.params.id);
  res.json({ success: true, data: { ok: true } });
});

export default router;
