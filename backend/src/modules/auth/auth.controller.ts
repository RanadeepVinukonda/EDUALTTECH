import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { ApiError } from "../../utils/ApiError.js";
import { config, isProd } from "../../config/env.js";
import { logger } from "../../utils/logger.js";
import { otpEmail } from "../../lib/email.js";
import { admin, anon, getUserByToken } from "../../lib/supabase.js";
import type { Role } from "@prisma/client";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
  sendPhoneOtpSchema,
  verifyPhoneOtpSchema,
  resendVerificationSchema,
  completeOnboardingSchema,
} from "./auth.schemas.js";

const PUBLIC_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarUrl: true,
  schoolName: true,
  className: true,
  isActive: true,
  emailVerifiedAt: true,
  phone: true,
  phoneVerifiedAt: true,
  interestedTopics: true,
  education: true,
  bio: true,
  onboardingDone: true,
  createdAt: true,
} as const;

type PublicUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  schoolName: string | null;
  className: string | null;
  isActive: boolean;
  emailVerifiedAt: Date | null;
  phone: string | null;
  phoneVerifiedAt: Date | null;
  interestedTopics: string[];
  education: string | null;
  bio: string | null;
  onboardingDone: boolean;
  createdAt: Date;
};

function stripUser(user: PublicUser): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    schoolName: user.schoolName,
    className: user.className,
    isActive: user.isActive,
    emailVerifiedAt: user.emailVerifiedAt,
    phone: user.phone,
    phoneVerifiedAt: user.phoneVerifiedAt,
    interestedTopics: user.interestedTopics,
    education: user.education,
    bio: user.bio,
    onboardingDone: user.onboardingDone,
    createdAt: user.createdAt,
  };
}

/**
 * Add capability flags on top of the public profile:
 *  - isProvider: approved teacher application, an active mentorship, or a owned course.
 *  - hasActiveSubscription: any non-expired plan (TRIAL unlocks everything too).
 */
async function augmentUser(user: PublicUser): Promise<PublicUser & { isProvider: boolean; hasActiveSubscription: boolean }> {
  const id = user.id;
  const [approvedApp, mentorships, taught, subscriptions] = await Promise.all([
    prisma.teacherApplication.count({ where: { userId: id, status: "APPROVED" } }),
    prisma.courseMentor.count({ where: { mentorId: id } }),
    prisma.course.count({ where: { teacherId: id } }),
    prisma.subscription.count({
      where: { userId: id, isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    }),
  ]);
  return {
    ...stripUser(user),
    isProvider: approvedApp > 0 || mentorships > 0 || taught > 0,
    hasActiveSubscription: subscriptions > 0,
  };
}

/** Look up the auth.users row by email (service role). */
async function findAuthUserByEmail(email: string) {
  const page = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  return page.data.users.find((u) => u.email?.toLowerCase() === email) ?? null;
}

function confirmedAt(authUser: { email_confirmed_at?: string | null; confirmed_at?: string | null }): Date | null {
  const raw = authUser.email_confirmed_at ?? authUser.confirmed_at;
  return raw ? new Date(raw) : null;
}

/**
 * Ensure a profile row exists for this auth.users id and keep the local
 * emailVerifiedAt flag in sync with Supabase's confirmation state.
 */
async function syncProfile(authUser: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
  email_confirmed_at?: string | null;
  confirmed_at?: string | null;
}): Promise<PublicUser> {
  const email = (authUser.email ?? "").toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!existing) {
    const name =
      typeof authUser.user_metadata?.name === "string"
        ? authUser.user_metadata.name
        : email.split("@")[0] ?? "Learner";
    return prisma.user.create({
      data: { id: authUser.id, email, name: name || "Learner", role: "USER" },
      select: PUBLIC_SELECT,
    });
  }
  const verified = confirmedAt(authUser);
  if (verified && !existing.emailVerifiedAt) {
    return prisma.user.update({ where: { id: authUser.id }, data: { emailVerifiedAt: verified }, select: PUBLIC_SELECT });
  }
  return existing;
}

/** Resolve a Supabase error into a clean ApiError. */
function translateAuthError(err: { code?: string; message: string }): ApiError {
  const code = err.code ?? "";
  if (code === "email_not_confirmed") {
    return ApiError.forbidden("Please verify your email first — the confirmation link is in your inbox");
  }
  const message = err.message || "";
  if (/already registered/i.test(message)) return ApiError.conflict("An account with this email already exists");
  if (/invalid login credentials|invalid_credentials/i.test(message)) {
    return ApiError.unauthorized("Invalid email or password");
  }
  if (/no user found|account not found|invalid_verification/i.test(message)) {
    return ApiError.badRequest("That address does not match a pending verification");
  }
  return ApiError.badRequest(message);
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();

    let signUp: Awaited<ReturnType<typeof anon.auth.signUp>>["data"];
    const { data: signUpResult, error: signUpError } = await anon.auth.signUp({
      email,
      password: data.password,
      options: {
        data: { name: data.name.trim() },
        emailRedirectTo: `${config.appBaseUrl.replace(/\/+$/, "")}/auth/callback`,
      },
    });
    signUp = signUpResult as typeof signUp;
    if (signUpError) {
      // Production must not hide a real SMTP outage. In dev the Resend
      // shared sender rejects non-owner inboxes, so create the account
      // anyway — the dev confirm endpoint replaces the emailed link.
      if (isProd) throw translateAuthError(signUpError);
      const fallback = await admin.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: false,
        user_metadata: { name: data.name.trim() },
      });
      if (fallback.error || !fallback.data.user) throw translateAuthError(signUpError);
      signUp = fallback.data as unknown as typeof signUp;
    }

    const authUser = signUp.user;
    if (!authUser) throw ApiError.unavailable("Could not create the account — try again");

    const profile = await syncProfile(authUser);
    // Supabase's "confirm email" setting is on by default → no session until the link is clicked.
    res.status(201).json({
      success: true,
      data: {
        user: stripUser(profile),
        requiresEmailConfirmation: true,
        accessToken: signUp.session?.access_token ?? null,
        refreshToken: signUp.session?.refresh_token ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);
    const email = data.email.toLowerCase().trim();

    const { data: signIn, error } = await anon.auth.signInWithPassword({ email, password: data.password });
    if (error) throw translateAuthError(error);

    const authUser = signIn.user;
    if (!authUser) throw ApiError.unauthorized("Invalid email or password");

    const profile = await syncProfile(authUser);
    if (!profile.isActive) throw ApiError.forbidden("This account has been deactivated");

    res.json({
      success: true,
      data: {
        user: await augmentUser(profile),
        accessToken: signIn.session?.access_token ?? null,
        refreshToken: signIn.session?.refresh_token ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function resendVerification(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = resendVerificationSchema.parse(req.body.toLowerCase());
    // Never reveal whether an address exists.
    const { error } = await anon.auth.resend({ type: "signup", email });
    if (error && !/already/i.test(error.message)) {
      logger.warn("Resend verification failed", { email: () => "***", err: error.message });
    }
    res.json({ success: true, data: { message: "If that account needs verifying, a new link is on its way" } });
  } catch (err) {
    next(err);
  }
}

// Development-only: confirm an email address without clicking the mail link,
// so the signup flow stays testable headless. Never exposed in production.
export async function devConfirmEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (isProd) throw ApiError.notFound("Not found");
    const email = resendVerificationSchema.parse(req.body).email.toLowerCase().trim();
    const authUser = await findAuthUserByEmail(email);
    if (!authUser) throw ApiError.notFound("No pending account for that email");
    const { error } = await admin.auth.admin.updateUserById(authUser.id, { email_confirm: true });
    if (error) throw translateAuthError(error);
    res.json({ success: true, data: { message: "Email confirmed" } });
  } catch (err) {
    next(err);
  }
}

const OTP_TTL_MS = 10 * 60 * 1000;

function hashOtp(userId: string, otp: string): string {
  return crypto.createHash("sha256").update(`${userId}:${otp}`).digest("hex");
}

export async function sendPhoneOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { phone } = sendPhoneOtpSchema.parse(req.body);
    const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

    await prisma.user.update({
      where: { id: req.user!.id },
      data: { phone, phoneOtpHash: hashOtp(req.user!.id, otp), phoneOtpExpiresAt: new Date(Date.now() + OTP_TTL_MS) },
    });

    // No SMS provider is wired yet, so the code is delivered by email. In
    // development it is also returned directly to keep the flow testable.
    let emailSent = false;
    try {
      await otpEmail(req.user!.email, otp);
      emailSent = true;
    } catch (err) {
      logger.warn("OTP email could not be sent", { err });
    }

    res.json({
      success: true,
      data: {
        message: emailSent ? "We emailed you a 6-digit code" : "Code generated",
        emailSent,
        ...(isProd ? {} : { devOtp: otp }),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyPhoneOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { otp } = verifyPhoneOtpSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw ApiError.notFound("User not found");

    if (!user.phoneOtpHash || !user.phoneOtpExpiresAt || user.phoneOtpExpiresAt < new Date()) {
      throw ApiError.badRequest("That code has expired — request a new one");
    }
    const provided = Buffer.from(hashOtp(user.id, otp));
    const stored = Buffer.from(user.phoneOtpHash);
    if (provided.length !== stored.length || !crypto.timingSafeEqual(provided, stored)) {
      throw ApiError.badRequest("That code is incorrect");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { phoneVerifiedAt: new Date(), phoneOtpHash: null, phoneOtpExpiresAt: null },
      select: PUBLIC_SELECT,
    });

    res.json({ success: true, data: { user: stripUser(updated) } });
  } catch (err) {
    next(err);
  }
}

export async function completeOnboarding(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = completeOnboardingSchema.parse(req.body);
    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        interestedTopics: data.interestedTopics,
        education: data.education,
        ...(data.bio ? { bio: data.bio } : {}),
        onboardingDone: true,
      },
      select: PUBLIC_SELECT,
    });
    res.json({ success: true, data: { user: stripUser(updated) } });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { refreshToken } = refreshSchema.parse(req.body);
    const { data, error } = await anon.auth.refreshSession({ refresh_token: refreshToken });
    if (error) throw translateAuthError(error);

    const authUser = data.user;
    if (!authUser) throw ApiError.unauthorized("Session expired — please sign in again");
    const profile = await syncProfile(authUser);
    if (!profile.isActive) throw ApiError.forbidden("This account has been deactivated");

    res.json({
      success: true,
      data: {
        user: stripUser(profile),
        accessToken: data.session?.access_token ?? null,
        refreshToken: data.session?.refresh_token ?? null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      await admin.auth.admin.signOut(header.slice("Bearer ".length)).catch(() => undefined);
    }
    res.json({ success: true, data: { message: "Logged out" } });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await prisma.user.findUnique({ where: { id: req.user!.id }, select: PUBLIC_SELECT });
    if (!profile) throw ApiError.notFound("User not found");
    res.json({ success: true, data: { user: await augmentUser(profile) } });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = updateProfileSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data,
      select: PUBLIC_SELECT,
    });
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = changePasswordSchema.parse(req.body);
    const { error } = await admin.auth.admin.updateUserById(req.user!.id, { password: data.newPassword });
    if (error) throw translateAuthError(error);
    // Kill every other session so the new password is respected everywhere.
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
      await admin.auth.admin.signOut(header.slice("Bearer ".length)).catch(() => undefined);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    res.json({ success: true, data: { message: "Password updated. Please sign in again." } });
  } catch (err) {
    next(err);
  }
}