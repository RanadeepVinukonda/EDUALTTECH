import rateLimit from "express-rate-limit";

/** General API limiter — generous; sensitive endpoints get their own buckets. */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 600,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many requests, please slow down." } },
  skip: (req) => req.originalUrl.startsWith("/api/payments/webhook"),
});

/**
 * Auth endpoints — a shared bucket lets code-spam lock victims out of login,
 * so login/register/refresh use this 30/15m limiter while email-code issuance
 * (codeLimiter) and password resets (passwordResetLimiter) get their own.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many attempts. Please wait and try again." } },
});

/** Password-reset issuance — own bucket so reset spam can't exhaust login. */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many reset requests. Please wait a few minutes." } },
});

/** Tight bucket for code issuance — throttles resend spam per IP. */
export const codeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many code requests. Please wait a few minutes." } },
});
