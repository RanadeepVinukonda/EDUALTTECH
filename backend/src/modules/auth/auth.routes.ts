import { Router } from "express";
import { createHash, randomInt } from "node:crypto";
import { z } from "zod";
import { config, isProd } from "../../config/env.js";
import { prisma } from "../../lib/prisma.js";
import { supabaseAdmin, getUserByToken } from "../../lib/supabase.js";
import { uploadPublic } from "../../lib/storage.js";
import { sendEmail, layout } from "../../lib/email.js";
import { audit } from "../../lib/audit.js";
import { requireAuth } from "../../middlewares/auth.js";
import { authLimiter, codeLimiter, passwordResetLimiter } from "../../middlewares/rate-limit.js";
import { validate, body } from "../../middlewares/validate.js";
import { ApiError } from "../../utils/ApiError.js";
import { DEV_CODE, sendEmailCode, verifyEmailCode, hasVerifiedCode, consumeCodes, hashEquals } from "./auth.service.js";

const router = Router();

const emailSchema = z.string().trim().toLowerCase().email("Enter a valid email");
const passwordSchema = z.string().min(8, "Use at least 8 characters");

type Profile = Awaited<ReturnType<typeof prisma.user.findUnique>>;

function shape(user: NonNullable<Profile>) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName} ${user.lastName}`.trim(),
    role: user.role,
    avatarUrl: user.avatarUrl,
    mobile: user.mobile,
    mobileVerifiedAt: Boolean(user.mobileVerifiedAt),
    emailVerifiedAt: Boolean(user.emailVerifiedAt),
    dateOfBirth: user.dateOfBirth,
    bio: user.bio,
    educationLevel: user.educationLevel,
    institution: user.institution,
    fieldOfStudy: user.fieldOfStudy,
    gradYear: user.gradYear,
    onboardingDone: user.onboardingDone,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

// ── Email verification (pre-signup) ────────────────────────────────

router.post(
  "/send-email-code",
  codeLimiter,
  validate({ body: z.object({ email: emailSchema }) }),
  async (req, res) => {
    const { email } = body<{ email: string }>(req);
    const out = await sendEmailCode(email);
    // devCode only ever returned when AUTH_SKIP_OTP is on (never in production).
    res.json({ success: true, data: out });
  },
);

router.post(
  "/verify-email-code",
  authLimiter,
  validate({ body: z.object({ email: emailSchema, code: z.string().trim().min(4).max(8) }) }),
  async (req, res) => {
    const { email, code } = body<{ email: string; code: string }>(req);
    const out = await verifyEmailCode(email, code);
    res.json({ success: true, data: out });
  },
);

// ── Register — requires a verified code, never emails passwords ────

router.post(
  "/register",
  authLimiter,
  validate({
    body: z.object({
      email: emailSchema,
      code: z.string().trim().min(4).max(8),
      firstName: z.string().trim().min(1).max(80),
      lastName: z.string().trim().min(1).max(80),
      password: passwordSchema,
    }),
  }),
  async (req, res) => {
    const input = body<{ email: string; code: string; firstName: string; lastName: string; password: string }>(req);

    const verified = await verifyEmailCode(input.email, input.code).then(() => true).catch(() => false);
    if (!verified || !(await hasVerifiedCode(input.email))) {
      throw ApiError.badRequest("Email verification is required before creating an account");
    }

    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw ApiError.conflict("An account with this email already exists", "EMAIL_TAKEN");

    const { data, error } = await supabaseAdmin().auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true, // email already proven via code
      user_metadata: { first_name: input.firstName, last_name: input.lastName },
    });
    if (error || !data.user) {
      throw ApiError.badRequest(error?.message ?? "Could not create the account");
    }

    const user = await prisma.user.create({
      data: {
        id: data.user.id,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        emailVerifiedAt: new Date(),
      },
    });

    await consumeCodes(input.email);
    audit(user.id, "user.registered", "user", user.id);

    const tokens = await signIn(input.email, input.password);
    res.status(201).json({ success: true, data: { user: shape(user), ...tokens } });
  },
);

async function signIn(email: string, password: string): Promise<{ accessToken: string; refreshToken: string }> {
  const { data, error } = await supabaseAdmin().auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "email_not_confirmed") {
      throw ApiError.forbidden("Please verify your email before signing in.", "EMAIL_NOT_VERIFIED");
    }
    throw ApiError.unauthorized("Incorrect email or password");
  }
  return { accessToken: data.session.access_token, refreshToken: data.session.refresh_token };
}

// ── Sessions ───────────────────────────────────────────────────────

router.post(
  "/login",
  authLimiter,
  validate({ body: z.object({ email: emailSchema, password: z.string().min(1) }) }),
  async (req, res) => {
    const { email, password } = body<{ email: string; password: string }>(req);
    const tokens = await signIn(email, password);
    const authUser = await getUserByToken(tokens.accessToken);
    const user = authUser ? await prisma.user.findUnique({ where: { id: authUser.id } }) : null;
    if (!user || !user.isActive) throw ApiError.forbidden("This account has been deactivated");
    res.json({ success: true, data: { user: shape(user), ...tokens } });
  },
);

router.post(
  "/refresh",
  authLimiter,
  validate({ body: z.object({ refreshToken: z.string().min(1) }) }),
  async (req, res) => {
    const { refreshToken } = body<{ refreshToken: string }>(req);
    const { data, error } = await supabaseAdmin().auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data.session) throw ApiError.unauthorized("Session expired");
    res.json({
      success: true,
      data: { accessToken: data.session.access_token, refreshToken: data.session.refresh_token },
    });
  },
);

router.post("/logout", requireAuth, async (req, res) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (token) await supabaseAdmin().auth.admin.signOut(token).catch(() => undefined);
  res.json({ success: true, data: { ok: true } });
});

router.post(
  "/forgot-password",
  passwordResetLimiter,
  validate({ body: z.object({ email: emailSchema }) }),
  async (req, res) => {
    const { email } = body<{ email: string }>(req);
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const { data } = await supabaseAdmin().auth.admin.generateLink({
        type: "recovery",
        email,
        options: { redirectTo: `${config.appBaseUrl}/reset-password` },
      });
      const link =
        data?.properties && "action_link" in data.properties ? data.properties.action_link : undefined;
      if (link) {
        await sendEmail({
          to: email,
          subject: "Reset your EduAltTech password",
          html: layout(
            "Reset your password",
            "We received a request to reset your password. This link expires shortly and can only be used once.",
            "Reset password",
            link,
          ),
        });
      }
    }
    // Always the same response — no account-existence oracle.
    res.json({ success: true, data: { ok: true } });
  },
);

// ── Profile ────────────────────────────────────────────────────────

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  if (!user) throw ApiError.notFound("Account not found");
  res.json({ success: true, data: { user: shape(user) } });
});

const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  mobile: z.string().trim().min(5).max(20).nullable().optional(),
  dateOfBirth: z.coerce.date().nullable().optional(),
  bio: z.string().trim().max(1000).nullable().optional(),
  educationLevel: z.string().trim().max(60).nullable().optional(),
  institution: z.string().trim().max(160).nullable().optional(),
  fieldOfStudy: z.string().trim().max(160).nullable().optional(),
  gradYear: z.number().int().min(1950).max(2100).nullable().optional(),
  onboardingDone: z.boolean().optional(),
});

router.patch("/me", requireAuth, validate({ body: profileSchema }), async (req, res) => {
  const patch = body<Record<string, unknown>>(req);
  const user = await prisma.user.update({ where: { id: req.user!.id }, data: patch });
  res.json({ success: true, data: { user: shape(user) } });
});

router.post(
  "/avatar",
  requireAuth,
  validate({
    body: z.object({
      name: z.string().min(1),
      type: z.string().regex(/^(image|application)\/[\w.+-]+$/),
      data: z.string().min(16), // base64 payload, server enforces size
    }),
  }),
  async (req, res) => {
    const meta = body<{ name: string; type: string; data: string }>(req);
    const bytes = Buffer.from(meta.data, "base64");
    if (bytes.length > config.limits.maxUploadBytes) throw ApiError.badRequest("Image is too large");
    const url = await uploadPublic("avatars", meta.name, bytes, meta.type);
    const user = await prisma.user.update({ where: { id: req.user!.id }, data: { avatarUrl: url } });
    res.json({ success: true, data: { avatarUrl: user.avatarUrl } });
  },
);

// ── Mobile verification (lazy — purchase / application trigger) ────

const PHONE_TTL_MIN = 10;
const PHONE_MAX_ATTEMPTS = 5;
const phoneHash = (mobile: string, code: string) =>
  createHash("sha256").update(`${mobile}:${code}`).digest("hex");

router.post(
  "/phone/send-otp",
  authLimiter,
  requireAuth,
  validate({ body: z.object({ mobile: z.string().trim().min(8).max(15).regex(/^\+?\d+$/, "Enter a valid mobile number") }) }),
  async (req, res) => {
    const { mobile } = body<{ mobile: string }>(req);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw ApiError.notFound("Account not found");

    if (config.auth.skipOtp) {
      await prisma.user.update({
        where: { id: user.id },
        data: { mobile, mobileOtpHash: phoneHash(mobile, DEV_CODE), mobileOtpExpiresAt: new Date(Date.now() + PHONE_TTL_MIN * 60_000), mobileOtpAttempts: 0 },
      });
      return res.json({ success: true, data: { devCode: DEV_CODE } });
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        mobile,
        mobileOtpHash: phoneHash(mobile, code),
        mobileOtpExpiresAt: new Date(Date.now() + PHONE_TTL_MIN * 60_000),
        mobileOtpAttempts: 0,
      },
    });

    // Twilio when configured; otherwise email fallback so the flow still works.
    const sent = await sendViaTwilio(mobile, code);
    if (!sent) {
      await sendEmail({
        to: user.email,
        subject: `${code} is your EduAltTech mobile verification code`,
        html: layout("Verify your mobile", `Your code is <strong style="font-size:24px;letter-spacing:6px">${code}</strong>. It expires in ${PHONE_TTL_MIN} minutes.`),
      });
    }
    res.json({ success: true, data: { ok: true } });
  },
);

router.post(
  "/phone/verify-otp",
  authLimiter,
  requireAuth,
  validate({ body: z.object({ code: z.string().trim().length(6) }) }),
  async (req, res) => {
    const { code } = body<{ code: string }>(req);
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user?.mobile || !user.mobileOtpHash || !user.mobileOtpExpiresAt) {
      throw ApiError.badRequest("Request a code first");
    }
    if (user.mobileOtpExpiresAt < new Date()) throw ApiError.badRequest("That code has expired. Request a new one.");
    if (user.mobileOtpAttempts >= PHONE_MAX_ATTEMPTS) throw ApiError.tooMany("Too many attempts. Request a new code.");

    const match = hashEquals(user.mobileOtpHash, phoneHash(user.mobile, code)) || (config.auth.skipOtp && code === DEV_CODE);
    if (!match) {
      await prisma.user.update({ where: { id: user.id }, data: { mobileOtpAttempts: { increment: 1 } } });
      throw ApiError.badRequest("Incorrect code.");
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { mobileVerifiedAt: new Date(), mobileOtpHash: null, mobileOtpExpiresAt: null, mobileOtpAttempts: 0 },
    });
    audit(updated.id, "user.mobile_verified", "user", updated.id);
    res.json({ success: true, data: { mobileVerifiedAt: updated.mobileVerifiedAt } });
  },
);

async function sendViaTwilio(mobile: string, code: string): Promise<boolean> {
  if (!config.sms.accountSid || !config.sms.authToken) return false;
  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${config.sms.accountSid}/Messages.json`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.sms.accountSid}:${config.sms.authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: mobile,
        From: process.env.TWILIO_FROM ?? "",
        Body: `Your EduAltTech verification code is ${code}`,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── OAuth (Google / Microsoft) ─────────────────────────────────────

router.post(
  "/oauth/url",
  authLimiter,
  validate({ body: z.object({ provider: z.enum(["google", "azure"]), redirectTo: z.string().url().optional() }) }),
  async (req, res) => {
    const { provider, redirectTo } = body<{ provider: "google" | "azure"; redirectTo?: string }>(req);
    if (redirectTo && !sameOrigin(redirectTo, config.appBaseUrl)) {
      throw ApiError.badRequest("Invalid redirect target");
    }
    const { data, error } = await supabaseAdmin().auth.signInWithOAuth({
      provider: provider === "google" ? "google" : "azure",
      options: { redirectTo: redirectTo ?? `${config.appBaseUrl}/auth/callback` },
    });
    if (error || !data.url) throw ApiError.badRequest(error?.message ?? "Could not start sign-in");
    res.json({ success: true, data: { url: data.url } });
  },
);

/** First sign-in with an OAuth provider has a Supabase user but no Prisma row; provision it here. */
router.post("/oauth/sync", authLimiter, async (req, res) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) throw ApiError.unauthorized("Missing token");

  const { data, error } = await supabaseAdmin().auth.getUser(token);
  const authUser = data?.user;
  if (error || !authUser?.email) throw ApiError.unauthorized("Invalid token");

  let user = await prisma.user.findUnique({ where: { id: authUser.id } });
  if (!user) {
    const meta = (authUser.user_metadata ?? {}) as Record<string, unknown>;
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "");
    const fullName = str(meta.full_name) || str(meta.name);
    const fallback = authUser.email.split("@")[0] ?? "";
    const nameParts = fullName.split(/\s+/);
    const firstName = (str(meta.first_name) || (nameParts[0] ?? "") || fallback).slice(0, 80);
    const lastName = (str(meta.last_name) || nameParts.slice(1).join(" ") || "Member").slice(0, 80);
    try {
      user = await prisma.user.create({
        data: { id: authUser.id, email: authUser.email, firstName, lastName, emailVerifiedAt: new Date() },
      });
      audit(user.id, "user.registered", "user", user.id, { via: "oauth" });
    } catch {
      // A concurrent request may have created it already.
      user = await prisma.user.findUnique({ where: { id: authUser.id } });
    }
  }
  if (!user) throw ApiError.badRequest("Could not provision your account. Please sign in again.");
  res.json({ success: true, data: { user: shape(user) } });
});

function sameOrigin(candidate: string, base: string): boolean {
  try {
    return new URL(candidate).origin === new URL(base).origin;
  } catch {
    return false;
  }
}

// ── Dev-only helpers (404 in production) ───────────────────────────

if (!isProd) {
  router.post(
    "/dev/confirm-email",
    validate({ body: z.object({ email: emailSchema }) }),
    async (req, res) => {
      const { email } = body<{ email: string }>(req);
      await prisma.user.updateMany({ where: { email }, data: { emailVerifiedAt: new Date() } });
      res.json({ success: true, data: { ok: true } });
    },
  );
}

export default router;
