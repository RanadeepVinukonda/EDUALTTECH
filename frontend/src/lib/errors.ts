import { ApiError } from "./api";

/** Documented backend error codes → user-facing copy. Unknown codes fall back to the server message. */
const CODE_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Your session expired. Please sign in again.",
  FORBIDDEN: "You don’t have permission to do that.",
  NOT_FOUND: "That item no longer exists.",
  VALIDATION: "Please check the highlighted fields and try again.",
  RATE_LIMITED: "Too many requests. Please wait a moment and try again.",
  EMAIL_TAKEN: "That email address is already registered.",
  ROADMAP_INCOMPLETE: "Add at least one chapter and topic before publishing.",
  HAS_ORDERS: "This course has orders and can’t be deleted.",
  HAS_PARTICIPANTS: "This course has participants and can’t be deleted.",
  PAYMENT_REQUIRED: "Payment is required before you can enroll.",
  FREE_COURSE: "This course is free — no payment is needed.",
  ALREADY_ENROLLED: "You’re already enrolled in this course.",
  ALREADY_PARTICIPANT: "This person already has a role in this course.",
  APPLICATION_EXISTS: "You’ve already applied for this course.",
  INVALID_TRANSITION: "That action isn’t allowed from the current state.",
  SIGNATURE_MISMATCH: "Payment verification failed. No charge was confirmed.",
  MOBILE_VERIFICATION_REQUIRED: "Verify your mobile number to continue.",
  LAST_ADMIN: "You can’t remove the last remaining admin.",
  NETWORK: "We couldn’t reach the server. Check your connection and try again.",
};

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

/** Network/transport failure or timeout — distinct from an authoritative backend response. */
export function isNetworkError(err: unknown): boolean {
  if (isApiError(err)) return err.code === "NETWORK" || err.status === 0;
  if (err instanceof DOMException && err.name === "AbortError") return true;
  return err instanceof TypeError;
}

export function isAuthError(err: unknown): boolean {
  return isApiError(err) && (err.code === "UNAUTHORIZED" || err.status === 401);
}

export function errorCode(err: unknown): string | null {
  return isApiError(err) ? err.code : null;
}

/** Prefers documented code copy, then the server message, then the fallback. */
export function describeError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (isApiError(err)) return CODE_MESSAGES[err.code] ?? err.message ?? fallback;
  if (isNetworkError(err)) return CODE_MESSAGES.NETWORK;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
