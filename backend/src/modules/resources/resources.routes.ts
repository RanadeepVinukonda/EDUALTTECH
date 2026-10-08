import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { uploadPrivate, removePrivate, signedUrl, assertUploadable } from "../../lib/storage.js";
import { requireAuth } from "../../middlewares/auth.js";
import { validate, body } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { audit } from "../../lib/audit.js";
import { getCourseAccess } from "../../lib/course-access.js";

const router = Router();

const resourceSelect = {
  id: true, title: true, description: true, kind: true, url: true, storagePath: true,
  fileSizeBytes: true, mimeType: true, downloads: true, isPublished: true, createdAt: true,
  courseId: true, topicId: true, ownerId: true,
  owner: { select: { firstName: true, lastName: true } },
  course: { select: { id: true, slug: true, title: true } },
} as const;

/** Access: general resources (courseId null) → owner/admin or published; course resources → course members. */
async function assertResourceRead(resource: { id: string; courseId: string | null; ownerId: string; isPublished: boolean }, user: { id: string; role: string }) {
  if (user.role === "ADMIN" || resource.ownerId === user.id) return;
  if (resource.courseId) {
    const access = await getCourseAccess(resource.courseId, user as never);
    if (!access.canRead) throw ApiError.forbidden("You are not part of this course");
    return;
  }
  if (!resource.isPublished) throw ApiError.notFound("Resource not found");
}

// My library: my uploads + published general + my courses' resources
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
        ...(myCourseIds.length > 0 ? [{ courseId: { in: myCourseIds } }] : []),
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

  // Private uploads → short-lived signed URL; links stay as-is.
  const downloadUrl = resource.storagePath ? await signedUrl(resource.storagePath) : resource.url;
  res.json({ success: true, data: { resource: { ...resource, storagePath: undefined, downloadUrl } } });
});

router.get("/:id/download", requireAuth, async (req, res) => {
  const resource = await prisma.resource.findUnique({ where: { id: req.params.id }, select: resourceSelect });
  if (!resource) throw ApiError.notFound("Resource not found");
  await assertResourceRead(resource, req.user!);

  await prisma.resource.update({ where: { id: resource.id }, data: { downloads: { increment: 1 } } });
  const downloadUrl = resource.storagePath ? await signedUrl(resource.storagePath, 300) : resource.url;
  res.json({ success: true, data: { downloadUrl } });
});

// Upload: owner-only; course resources require staff on that course
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
      linkUrl: z.string().url().nullable().optional(),
      file: z.object({ name: z.string().min(1).max(200), type: z.string().min(3), data: z.string().min(16) }).nullable().optional(),
    }),
  }),
  async (req, res) => {
    const input = body<{
      title: string; description?: string | null; kind: string;
      courseId?: string | null; topicId?: string | null; linkUrl?: string | null;
      file?: { name: string; type: string; data: string } | null;
    }>(req);

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
      storagePath = await uploadPrivate(input.courseId ? `courses/${input.courseId}` : "resources", input.file.name, bytes, input.file.type);
      fileSizeBytes = bytes.length;
      mimeType = input.file.type;
    }

    const resource = await prisma.resource.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        kind: input.kind,
        courseId: input.courseId ?? null,
        topicId: input.topicId ?? null,
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

router.patch("/:id", requireAuth, validate({
  body: z.object({
    title: z.string().trim().min(2).max(160).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    isPublished: z.boolean().optional(),
    linkUrl: z.string().url().nullable().optional(),
  }),
}), async (req, res) => {
  const existing = await prisma.resource.findUnique({ where: { id: req.params.id }, select: { ownerId: true, courseId: true, storagePath: true } });
  if (!existing) throw ApiError.notFound("Resource not found");

  const isOwner = existing.ownerId === req.user!.id;
  if (!isOwner && req.user!.role !== "ADMIN") {
    if (existing.courseId) {
      const access = await getCourseAccess(existing.courseId, req.user!);
      if (!access.isStaff) throw ApiError.forbidden("Only the owner or course staff can edit this");
    } else {
      throw ApiError.forbidden("Only the owner can edit this");
    }
  }

  const { linkUrl, ...patch } = body<Record<string, unknown>>(req);
  const updated = await prisma.resource.update({
    where: { id: req.params.id },
    data: { ...(linkUrl !== undefined ? { url: linkUrl } : {}), ...patch },
    select: resourceSelect,
  });
  res.json({ success: true, data: { resource: updated } });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const existing = await prisma.resource.findUnique({ where: { id: req.params.id }, select: { ownerId: true, storagePath: true } });
  if (!existing) throw ApiError.notFound("Resource not found");
  if (existing.ownerId !== req.user!.id && req.user!.role !== "ADMIN") {
    throw ApiError.forbidden("Only the owner can delete this");
  }
  await prisma.resource.delete({ where: { id: req.params.id } });
  if (existing.storagePath) await removePrivate(existing.storagePath).catch(() => undefined);
  audit(req.user!.id, "resource.deleted", "resource", req.params.id);
  res.json({ success: true, data: { ok: true } });
});

export default router;
