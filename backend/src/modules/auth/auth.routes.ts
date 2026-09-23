import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  register,
  login,
  refresh,
  logout,
  me,
  updateProfile,
  changePassword,
  resendVerification,
  sendPhoneOtp,
  verifyPhoneOtp,
  completeOnboarding,
  devConfirmEmail,
} from "./auth.controller.js";
import { validate } from "./auth.validator.js";
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  updateProfileSchema,
  changePasswordSchema,
  resendVerificationSchema,
  sendPhoneOtpSchema,
  verifyPhoneOtpSchema,
  completeOnboardingSchema,
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
router.post("/resend-verification", authLimiter, validate(resendVerificationSchema), resendVerification);
router.post("/refresh", validate(refreshSchema), refresh);
router.post("/logout", requireAuth, logout);
router.post("/dev/confirm-email", validate(resendVerificationSchema), devConfirmEmail);

router.get("/me", requireAuth, me);
router.patch("/me", requireAuth, validate(updateProfileSchema), updateProfile);
router.post("/change-password", requireAuth, validate(changePasswordSchema), changePassword);

router.post("/phone/send-otp", authLimiter, requireAuth, validate(sendPhoneOtpSchema), sendPhoneOtp);
router.post("/phone/verify-otp", requireAuth, validate(verifyPhoneOtpSchema), verifyPhoneOtp);
router.post("/onboarding", requireAuth, validate(completeOnboardingSchema), completeOnboarding);

export default router;
