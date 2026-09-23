import { Router } from "express";
import express from "express";
import { requireAuth, requireRole } from "../../middlewares/auth.js";
import { validate } from "../../middlewares/validate.js";
import { paymentsController, createOrderSchema, verifySchema } from "./payments.controller.js";

const router = Router();

// ── Checkout flow (any authenticated user) ─────────────────────────
router.post("/orders", requireAuth, validate(createOrderSchema()), paymentsController.createOrder);
router.post("/verify", requireAuth, validate(verifySchema), paymentsController.verify);

// ── Razorpay webhook (raw body, signature verified) ────────────────
router.post("/webhook", express.raw({ type: "*/*", limit: "1mb" }), paymentsController.webhook);

// ── Ledger inspection ──────────────────────────────────────────────
router.get("/orders", requireAuth, requireRole("ADMIN"), paymentsController.listOrders);
router.get("/webhook-events", requireAuth, requireRole("ADMIN"), paymentsController.listWebhookEvents);
router.get("/my-orders", requireAuth, paymentsController.myOrders);

export default router;