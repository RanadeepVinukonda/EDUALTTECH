import { timingSafeEqual } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { config } from "../config/env.js";

/**
 * Full-site lock. When MAINTENANCE_MODE=true every request is refused with 503
 * unless it carries the correct token hash in `x-maintenance-token`. Only
 * /health and CORS preflight pass. The raw secret never leaves the server —
 * the header carries sha256(secret), compared in constant time.
 */
export function maintenanceGate(req: Request, res: Response, next: NextFunction): void {
  if (!config.maintenance.enabled) return next();
  // CORS preflight, health probes, and provider webhooks (server-to-server,
  // HMAC-signed) must keep working while the site is locked.
  if (req.method === "OPTIONS" || req.path === "/health" || req.path.startsWith("/api/payments/webhook")) return next();

  const sent = Buffer.from(req.header("x-maintenance-token") ?? "", "hex");
  const expected = Buffer.from(config.maintenance.tokenHash, "hex");
  if (sent.length === expected.length && expected.length === 32 && timingSafeEqual(sent, expected)) {
    return next();
  }

  res.status(503).json({ success: false, error: { code: "MAINTENANCE", message: "Service is under maintenance." } });
}