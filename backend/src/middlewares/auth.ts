/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { ApiError } from "../utils/ApiError.js";
import { prisma } from "../lib/prisma.js";
import { getUserByToken } from "../lib/supabase.js";

async function attach(req: Request<any>): Promise<boolean> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) return false;

  const auth = await getUserByToken(token);
  if (!auth) return false;

  const user = await prisma.user.findUnique({
    where: { id: auth.id },
    select: { id: true, email: true, role: true, isActive: true },
  });
  if (!user || !user.isActive) return false;

  req.user = { id: user.id, email: user.email, role: user.role };
  return true;
}

export async function requireAuth(req: Request<any>, _res: Response, next: NextFunction): Promise<void> {
  try {
    const ok = await attach(req);
    if (!ok) return next(ApiError.unauthorized("Missing or invalid token"));
    next();
  } catch (err) {
    next(err);
  }
}

export function requireRole(...roles: Role[]) {
  return (req: Request<any>, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized("Authentication required"));
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden("Insufficient permissions"));
    next();
  };
}

/** Attaches req.user when a valid token is present; never rejects anonymous visitors. */
export async function optionalAuth(req: Request<any>, _res: Response, next: NextFunction): Promise<void> {
  try {
    await attach(req).catch(() => false);
    next();
  } catch (err) {
    next(err);
  }
}

/** Mobile verification gate — spec §7: prompted at purchase/application time only. */
export async function requireVerifiedMobile(req: Request<any>, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) return next(ApiError.unauthorized());
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { mobileVerifiedAt: true },
  });
  if (!user?.mobileVerifiedAt) {
    return next(ApiError.forbidden("Mobile verification is required to continue", "MOBILE_VERIFICATION_REQUIRED"));
  }
  next();
}
