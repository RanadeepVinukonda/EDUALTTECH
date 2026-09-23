import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError.js";
import type { Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { getUserByToken } from "../lib/supabase.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; email: string; role: Role };
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next(ApiError.unauthorized("Missing bearer token"));
  }
  const auth = await getUserByToken(header.slice("Bearer ".length));
  if (!auth) return next(ApiError.unauthorized("Invalid or expired token"));

  const user = await prisma.user.findUnique({ where: { id: auth.id }, select: { id: true, email: true, role: true } });
  req.user = user ?? { id: auth.id, email: auth.email, role: "USER" };
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

export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const auth = await getUserByToken(header.slice("Bearer ".length));
    if (auth) {
      const user = await prisma.user.findUnique({ where: { id: auth.id }, select: { id: true, email: true, role: true } });
      req.user = user ?? { id: auth.id, email: auth.email, role: "USER" };
    }
  }
  next();
}