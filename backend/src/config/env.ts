import dotenv from "dotenv";
import { createHash } from "node:crypto";

dotenv.config();

const sha256Hex = (value: string) => createHash("sha256").update(value).digest("hex");

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") throw new Error(`Missing required env var: ${name}`);
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name]?.trim() ?? fallback;
}

function bool(name: string, fallback = false): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  if (v === undefined || v === "") return fallback;
  return v === "true" || v === "1";
}

export const env = (process.env.NODE_ENV ?? "development").trim().toLowerCase();
export const isProd = env === "production";

export const config = {
  env,
  isProd,
  port: Number(process.env.PORT ?? 5000),
  appOrigin: process.env.APP_ORIGIN ?? "http://localhost:3000",
  appBaseUrl: optional("APP_BASE_URL", process.env.APP_ORIGIN ?? "http://localhost:3000"),

  db: {
    url: required("DATABASE_URL"),
  },

  razorpay: {
    keyId: optional("RAZORPAY_KEY_ID"),
    keySecret: optional("RAZORPAY_KEY_SECRET"),
    webhookSecret: optional("RAZORPAY_WEBHOOK_SECRET"),
  },

  email: {
    resendApiKey: optional("RESEND_API_KEY"),
    from: optional("EMAIL_FROM", "EduAltTech <onboarding@resend.dev>"),
  },

  supabase: {
    url: required("SUPABASE_URL"),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    anonKey: required("SUPABASE_ANON_KEY"),
    publicBucket: optional("SUPABASE_PUBLIC_BUCKET", "public-assets"),
    privateBucket: optional("SUPABASE_PRIVATE_BUCKET", "private-assets"),
  },

  limits: {
    maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 5 * 1024 * 1024),
    quotaPerUserBytes: Number(process.env.QUOTA_PER_USER_BYTES ?? 50 * 1024 * 1024),
  },

  sms: {
    accountSid: optional("TWILIO_ACCOUNT_SID"),
    authToken: optional("TWILIO_AUTH_TOKEN"),
    verifyServiceSid: optional("TWILIO_VERIFY_SERVICE_SID"),
  },

  // OTP/verification bypass — testing switch until Supabase OTP is wired in.
  // Secure by default: OFF unless AUTH_SKIP_OTP is explicitly "true"/"1".
  // Local dev sets AUTH_SKIP_OTP=true to accept the dev code 000000.
  auth: {
    skipOtp: bool("AUTH_SKIP_OTP", false),
  },

  // Full-site lock: MAINTENANCE_MODE=true blocks every /api/* request (except
  // health + CORS preflight) unless the caller sends the correct token hash in
  // the `x-maintenance-token` header. Hash, not the raw secret, is compared.
  maintenance: {
    enabled: bool("MAINTENANCE_MODE", false),
    tokenHash: sha256Hex(process.env.MAINTENANCE_TOKEN?.trim() ?? ""),
  },

  logLevel: process.env.LOG_LEVEL ?? "info",
} as const;
