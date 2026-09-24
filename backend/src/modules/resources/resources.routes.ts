import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { requireAuth } from "../../middlewares/auth.js";
import { ApiError } from "../../utils/ApiError.js";
import { config } from "../../config/env.js";
import { uploadFile, deleteFile, publicFileUrl, storageKey } from "../../lib/storage.js";

const router = Router();

const KINDS = ["pdf", "doc", "slides", "video", "link", "audio"];

router.get("/", async (req, res, next) => {
  try {
    const q = z
      .object({
        subject: z.string().optional(),
        kind: z.string().optional(),
        search: z.string().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(24),
      })
      .parse(req.query);

    const where = {
      isPublished: true,
      ...(q.subject ? { subject: q.subject } : {}),
      ...(q.kind ? { kind: q.kind } : {}),
      ...(q.search ? { title: { contains: q.search, mode: "insensitive" as const } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.resource.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (q.page - 1) * q.limit,
        take: q.limit,
      }),
      prisma.resource.count({ where }),
    ]);

    res.json({ success: true, data: { items, total, page: q.page, limit: q.limit } });
  } catch (err) {
    next(err);
  }
});

// Uploaded file — used for per-user quota checks. Excludes pasted links.
const UPLOAD_SELECT = {
  id: true,
  title: true,
  subject: true,
  kind: true,
  thumbnailUrl: true,
  fileUrl: true,
  fileSizeBytes: true,
  mimeType: true,
  createdAt: true,
  ownerId: true,
} as const;

router.get("/my", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const [items, usage] = await Promise.all([
      prisma.resource.findMany({
        where: { ownerId: userId },
        orderBy: { createdAt: "desc" },
        select: UPLOAD_SELECT,
      }),
      prisma.resource.aggregate({
        where: { ownerId: userId, storagePath: { not: null } },
        _sum: { fileSizeBytes: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        items,
        quotaBytes: config.limits.quotaPerUserBytes,
        usedBytes: usage._sum.fileSizeBytes ?? 0,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post(
  "/upload",
  requireAuth,
  // ponytail: raw body capped just above per-file limit — no multer dependency.
  // Upgrade to streaming multipart if we ever ship files near the cap routinely.
  (req, _res, next) => {
    const name = req.headers["content-type"];
    if (!name || !(typeof name === "string") || !name.includes("octet-stream")) {
      return next(ApiError.badRequest("Send file as application/octet-stream body"));
    }
    next();
  },
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const title = (req.headers["x-resource-title"] ?? "").toString().trim();
      const subject = (req.headers["x-resource-subject"] ?? "General").toString().trim().slice(0, 60);
      const kindRaw = (req.headers["x-resource-kind"] ?? "pdf").toString();
      const fileName = (req.headers["x-resource-file"] ?? "file").toString().trim() || "file";
      const mimeType = (req.headers["x-resource-mime"] ?? "application/octet-stream").toString();
      const thumbnailUrl = req.headers["x-resource-thumb"]?.toString().trim().slice(0, 500) || null;

      if (!title) throw ApiError.badRequest("x-resource-title header is required");
      if (!KINDS.includes(kindRaw)) throw ApiError.badRequest(`Kind must be one of: ${KINDS.join(", ")}`);

      const length = Number(req.headers["content-length"] ?? 0);
      if (!Number.isFinite(length) || length <= 0) throw ApiError.badRequest("Missing Content-Length");
      if (length > config.limits.maxUploadBytes) {
        throw ApiError.badRequest(`File too large — max ${Math.round(config.limits.maxUploadBytes / 1024 / 1024)} MB`);
      }

      const used = await prisma.resource.aggregate({
        where: { ownerId: userId, storagePath: { not: null } },
        _sum: { fileSizeBytes: true },
      });
      if ((used._sum.fileSizeBytes ?? 0) + length > config.limits.quotaPerUserBytes) {
        throw ApiError.badRequest("Per-user storage quota exceeded — delete a file first");
      }

      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = Buffer.concat(chunks);
      if (body.byteLength !== length) throw ApiError.badRequest("Body size does not match Content-Length");

      const path = storageKey(userId, fileName, mimeType);
      await uploadFile(config.supabase.storageBucket, path, body, mimeType);

      const resource = await prisma.resource.create({
        data: {
          title,
          subject,
          kind: kindRaw,
          thumbnailUrl,
          fileUrl: publicFileUrl(config.supabase.storageBucket, path),
          fileSizeBytes: length,
          mimeType,
          storagePath: path,
          ownerId: userId,
        },
        select: UPLOAD_SELECT,
      });

      res.status(201).json({ success: true, data: { resource } });
    } catch (err) {
      next(err);
    }
  },
);

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const resource = await prisma.resource.findUnique({ where: { id: String(req.params.id) } });
    if (!resource) throw ApiError.notFound("Resource not found");
    if (resource.ownerId !== req.user!.id) throw ApiError.forbidden("Not your resource");

    if (resource.storagePath) {
      try {
        await deleteFile(config.supabase.storageBucket, resource.storagePath);
      } catch {
        // rows always win over orphan cleanup — the row delete is the source of truth
      }
    }
    await prisma.resource.delete({ where: { id: resource.id } });
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/download", async (req, res, next) => {
  try {
    const resource = await prisma.resource.findFirst({
      where: { id: req.params.id!, isPublished: true },
    });
    if (!resource) throw ApiError.notFound("Resource not found");

    await prisma.resource.update({
      where: { id: resource.id },
      data: { downloads: { increment: 1 } },
    });

    res.json({ success: true, data: { fileUrl: resource.fileUrl } });
  } catch (err) {
    next(err);
  }
});

export default router;