import { Router } from "express";
import rateLimit from "express-rate-limit";
import { randomUUID } from "node:crypto";
import { prisma } from "../../lib/prisma.js";
import { uploadFile, publicFileUrl } from "../../lib/storage.js";
import { config } from "../../config/env.js";
import { ApiError } from "../../utils/ApiError.js";
import {
  register,
  login,
  refresh,
  logout,
  me,
  updateProfile,
  changePassword,
  resendVerification,
  sendEmailCode,
  verifyEmailCode,
  sendPhoneOtp,
  verifyPhoneOtp,
  completeOnboarding,
  devConfirmEmail,
  forgotPassword,
  oauthUrl,
  oauthImport,
} from "./auth.controller.js";
import { validate } from "./auth.validator.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
  resendVerificationSchema,
  sendCodeSchema,
  verifyCodeSchema,
  sendPhoneOtpSchema,
  verifyPhoneOtpSchema,
  completeOnboardingSchema,
  oauthSchema,
  forgotPasswordSchema,
  oauthImportSchema,
} from "./auth.schemas.js";
import { requireAuth } from "../../middlewares/auth.js";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many auth attempts, try again later." } },
});

const router = Router();

router.post("/register", authLimiter, validate(registerSchema), register);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post("/oauth/url", authLimiter, validate(oauthSchema), oauthUrl);
router.post("/oauth/import", authLimiter, validate(oauthImportSchema), oauthImport);
router.post("/resend-verification", authLimiter, validate(resendVerificationSchema), resendVerification);
router.post("/send-email-code", authLimiter, validate(sendCodeSchema), sendEmailCode);
router.post("/verify-email-code", validate(verifyCodeSchema), verifyEmailCode);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/logout", requireAuth, logout);
router.post("/dev/confirm-email", validate(resendVerificationSchema), devConfirmEmail);

router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, validate(updateProfileSchema), updateProfile);
router.post("/change-password", requireAuth, validate(changePasswordSchema), changePassword);

// Avatar upload — raw image body → Supabase Storage → returns the new URL.
router.post("/avatar", requireAuth, async (req, res, next) => {
  try {
    const raw = (req.headers["x-avatar-mime"] ?? req.headers["content-type"] ?? "").toString();
    const mimeType = raw.split(/[;,]/)[0] || "image/jpeg";
    if (!mimeType.startsWith("image/")) throw ApiError.badRequest("Avatar must be an image");
    const maxBytes = config.limits.maxUploadBytes;
    const length = Number(req.headers["content-length"] ?? 0);
    if (!Number.isFinite(length) || length <= 0) throw ApiError.badRequest("Missing Content-Length");
    if (length > maxBytes) {
      throw ApiError.badRequest(`Avatar too large — max ${Math.round(maxBytes / 1024 / 1024)} MB`);
    }

    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const body = Buffer.concat(chunks);
    if (body.byteLength !== length) throw ApiError.badRequest("Body size does not match Content-Length");

    const ext = mimeType.split("/")[1] ?? "jpeg";
    const path = `avatars/${req.user!.id}/${randomUUID()}.${ext}`;
    await uploadFile(config.supabase.storageBucket, path, body, mimeType);
    const avatarUrl = publicFileUrl(config.supabase.storageBucket, path);
    await prisma.user.update({ where: { id: req.user!.id }, data: { avatarUrl } });
    res.status(201).json({ success: true, data: { avatarUrl } });
  } catch (err) {
    next(err);
  }
});

router.post("/phone/send-otp", authLimiter, requireAuth, validate(sendPhoneOtpSchema), sendPhoneOtp);
router.post("/phone/verify-otp", requireAuth, validate(verifyPhoneOtpSchema), verifyPhoneOtp);
router.post("/onboarding", requireAuth, validate(completeOnboardingSchema), completeOnboarding);

export default router;
