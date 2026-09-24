import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name]?.trim() ?? fallback;
}

export const env = process.env.NODE_ENV ?? "development";
export const isProd = env === "production";

export const config = {
  env,
  isProd,
  port: Number(process.env.PORT ?? 5000),
  appOrigin: process.env.APP_ORIGIN ?? "http://localhost:3000",

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
    from: optional("EMAIL_FROM", "Edu-Alt-Tech <onboarding@resend.dev>"),
  },

  supabase: {
    url: required("SUPABASE_URL"),
    serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
    anonKey: required("SUPABASE_ANON_KEY"),
    storageBucket: optional("SUPABASE_STORAGE_BUCKET", "resources"),
  },

  limits: {
    // Per-upload cap and per-user lifetime quota (bytes). User quota is
    // checked against the sum of stored uploads, so bump down later and it
    // only stops new uploads, never deletes existing data.
    maxUploadBytes: Number(process.env.MAX_UPLOAD_BYTES ?? 25 * 1024 * 1024),
    quotaPerUserBytes: Number(process.env.QUOTA_PER_USER_BYTES ?? 100 * 1024 * 1024),
  },

  appBaseUrl: optional("APP_BASE_URL", process.env.APP_ORIGIN ?? "http://localhost:3000"),

  // When "true", auth session tokens move into HttpOnly cookies ("eat.access" /
  // "eat.refresh") and the API accepts them instead of the Authorization header.
  // Only enable when API and web app share a site (or site + subdomain); the
  // CORS setup must allow credentials for cross-origin apps.
  authCookie: optional("AUTH_COOKIE", "false") === "true",

  sms: {
    accountSid: optional("TWILIO_ACCOUNT_SID"),
    authToken: optional("TWILIO_AUTH_TOKEN"),
    verifyServiceSid: optional("TWILIO_VERIFY_SERVICE_SID"),
  },

  logLevel: process.env.LOG_LEVEL ?? "info",
} as const;