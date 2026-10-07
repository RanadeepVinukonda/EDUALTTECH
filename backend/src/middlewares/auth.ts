import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import type { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { getUserByToken } from "../lib/supabase.js";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: Role };
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) {
    return next(ApiError.unauthorized("Missing bearer token"));
  }
  const auth = await getUserByToken(token);
  if (!auth) return next(ApiError.unauthorized("Invalid or expired token"));

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { id: true, email: true, role: true, isActive: true },
  });
  if (!user) return next(ApiError.unauthorized("Account no longer exists"));
  if (!user.isActive) return next(ApiError.forbidden("This account has been deactivated"));
  req.user = { id: user.id, email: user.email, role: user.role };
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized("Authentication required"));
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("Insufficient permissions"));
    }
    next();
  };
}

/** Attach req.user when a valid token is present; never rejects anonymous visitors. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) return next();
  const auth = await getUserByToken(token).catch(() => null);
  if (!auth) return next();
  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { id: true, email: true, role: true, isActive: true },
  });
  if (!user?.isActive) return next();
  req.user = { id: user.id, email: user.email, role: user.role };
  next();
}