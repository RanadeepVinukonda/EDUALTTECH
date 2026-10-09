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
 * Auth endpoints — one shared bucket would let code-spam lock victims out of
 * login, so verification endpoints use this tighter per-route limiter instead.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many attempts. Please wait and try again." } },
});

/** Tight bucket for code issuance — throttles resend spam per IP. */
export const codeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { code: "RATE_LIMITED", message: "Too many code requests. Please wait a few minutes." } },
});
