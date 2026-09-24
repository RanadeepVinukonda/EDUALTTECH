import { Router } from "express";
import {
  listPublished,
  getPublished,
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

const router = Router();

// Public marketing pages
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