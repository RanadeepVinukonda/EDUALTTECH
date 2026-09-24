import { z } from "zod";

/** Shared password policy: 8–128 chars, must contain a letter and a digit. */
export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .refine((p) => /[A-Za-z]/.test(p) && /\d/.test(p), {
    message: "Password must contain at least one letter and one number",
  });

/** E.164-ish: optional +, 7–15 digits. Spaces/dashes are stripped before validating. */
export const phoneSchema = z
  .string()
  .trim()
  .transform((p) => p.replace(/[\s-()]/g, ""))
  .refine((p) => /^\+?\d{7,15}$/.test(p), { message: "Enter a valid mobile number" });

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name").max(40),
  lastName: z.string().trim().min(1, "Enter your last name").max(40),
  email: z.string().email().max(160),
  password: passwordSchema,
  phone: phoneSchema.optional(),
  schoolName: z.string().trim().max(120).optional(),
  className: z.string().trim().max(40).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().max(160),
  password: z.string().min(1).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10).max(512),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatarUrl: z.string().url().optional(),
  schoolName: z.string().trim().max(120).optional(),
  className: z.string().trim().max(40).optional(),
  bio: z.string().trim().max(600).optional(),
  education: z.string().trim().max(80).optional(),
  interestedTopics: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
});

export const changePasswordSchema = z.object({
  newPassword: passwordSchema,
  // Supabase owns passwords. Current-password checking is skipped — the
  // caller already holds a live session token.
});

export const sendPhoneOtpSchema = z.object({ phone: phoneSchema });

export const verifyPhoneOtpSchema = z.object({
  otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const resendVerificationSchema = z.object({ email: z.string().email().max(160) });

export const sendCodeSchema = z.object({ email: z.string().email().max(160) });

export const verifyCodeSchema = z.object({
  email: z.string().email().max(160),
  code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const completeOnboardingSchema = z.object({
  interestedTopics: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
  education: z.string().trim().min(2).max(80),
  bio: z.string().trim().max(600).optional(),
});