import { Router, type Request, type Response, type NextFunction } from "express";
import {
  listPublished,
  getPublished,
  listMedia,
  adminList,
  adminCreate,
  adminUpdate,
  adminDelete,
  openConversation,
  listConversations,
  getMessages,
  sendMessage,
} from "./cms.controller.js";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { ApiError } from "../../utils/ApiError.js";
import { uploadFile, publicFileUrl, storageKey } from "../../lib/storage.js";
import { config } from "../../config/env.js";

const router = Router();

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif", "image/avif"];

// Admin image upload → raw body → Supabase storage. Returns public URL to paste
// into coverUrl / logoUrl / media url. Same pattern as /api/resources/upload.
router.post(
  "/admin/upload",
  requireAuth,
  requireRole("ADMIN"),
  (req: Request, res: Response, next: NextFunction) => {
    const type = req.headers["content-type"];
    if (!type || !IMAGE_TYPES.includes(type.toLowerCase())) {
      return next(ApiError.badRequest("Send an image file (PNG/JPEG/WEBP/GIF/AVIF) as the request body"));
    }
    const length = Number(req.headers["content-length"] ?? 0);
    if (!Number.isFinite(length) || length <= 0) return next(ApiError.badRequest("Missing Content-Length"));
    if (length > config.limits.maxUploadBytes) {
      return next(ApiError.badRequest(`Image too large — max ${Math.round(config.limits.maxUploadBytes / 1024 / 1024)} MB`));
    }
    next();
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = req.headers["content-type"]!.toLowerCase();
      const file = (req.headers["x-cms-file"] ?? "image").toString().slice(0, 80) || "image";
      // Folders: logos → "school_logos", everything else → "media"
      const folderRaw = (req.headers["x-cms-folder"] ?? "media").toString();
      const folder = /^[a-z0-9_-]{1,50}$/.test(folderRaw) ? folderRaw : "media";
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = Buffer.concat(chunks);
      const path = storageKey(folder, file, type);
      await uploadFile(config.supabase.storageBucket, path, body, type);
      res.status(201).json({ success: true, data: { url: publicFileUrl(config.supabase.storageBucket, path) } });
    } catch (err) {
      next(err);
    }
  },
);

// Public marketing pages
router.get("/public/media", listMedia);
router.get("/public/:kind", listPublished);
router.get("/public/:kind/:slug", getPublished);

// Admin CRUD (orgs, work, programs, media)
router.get("/admin/:kind", requireAuth, requireRole("ADMIN"), adminList);
router.post("/admin/:kind", requireAuth, requireRole("ADMIN"), adminCreate);
router.patch("/admin/:kind/:id", requireAuth, requireRole("ADMIN"), adminUpdate);
router.delete("/admin/:kind/:id", requireAuth, requireRole("ADMIN"), adminDelete);

// Private mentor↔student conversations (per enrollment)
router.post("/conversations/enrollment/:enrollmentId", requireAuth, openConversation);
router.get("/conversations", requireAuth, listConversations);
router.get("/conversations/:id/messages", requireAuth, getMessages);
router.post("/conversations/:id/messages", requireAuth, sendMessage);

export default router;