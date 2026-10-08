import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma.js";
import { logger } from "../utils/logger.js";

/**
 * Fire-and-forget audit entry. Never blocks or fails the request that
 * triggered it; failures are logged only.
 */
export function audit(
  actorId: string | null,
  action: string,
  targetType: string,
  targetId?: string | null,
  meta?: Prisma.InputJsonValue,
): void {
  prisma.auditLog
    .create({ data: { actorId, action, targetType, targetId: targetId ?? null, meta: meta ?? undefined } })
    .catch((err) => logger.error("audit write failed", { action, err: String(err) }));
}
