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

/** Education profile — used at signup and in profile/onboarding. */
export const educationFields = {
  interestedTopics: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  education: z.string().trim().max(80).optional(),
  educationBoard: z.string().trim().max(60).optional(),
  educationClass: z.string().trim().max(40).optional(),
  qualification: z.string().trim().max(60).optional(),
  degree: z.string().trim().max(80).optional(),
  college: z.string().trim().max(120).optional(),
  gradYear: z.number().int().min(1960).max(2100).optional(),
} as const;

export const registerSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name").max(40),
  lastName: z.string().trim().min(1, "Enter your last name").max(40),
  email: z.string().email().max(160),
  password: passwordSchema,
  phone: phoneSchema.optional(),
  schoolName: z.string().trim().max(120).optional(),
  className: z.string().trim().max(40).optional(),
  ...educationFields,
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
  ...educationFields,
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
  bio: z.string().trim().max(600).optional(),
  ...educationFields,
  interestedTopics: z.array(z.string().trim().min(1).max(40)).min(1).max(20),
  education: z.string().trim().min(2).max(80),
});