import { prisma } from "./prisma.js";
import { logger } from "../utils/logger.js";

/**
 * Append to the admin audit trail. Fire-and-forget: a failed audit write
 * must never fail the action it records — log and move on.
 */
export function audit(actorId: string, action: string, targetType: string, targetId?: string, meta?: unknown): void {
  prisma.auditLog
    .create({
      data: {
        actorId,
        action,
        targetType,
        targetId,
        meta: meta === undefined ? undefined : (meta as object),
      },
    })
    .catch((err: unknown) => logger.warn("Audit write failed", { action, err }));
}