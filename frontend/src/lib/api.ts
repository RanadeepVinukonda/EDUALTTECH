/**
 * Minimal API client for the EduAltTech backend.
 * - Attaches the access token
 * - On 401, tries one refresh-token rotation, then retries the request once
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000/backend";

const ACCESS_KEY = "eat.access";
const REFRESH_KEY = "eat.refresh";
const USER_KEY = "eat.user";
const REMEMBER_KEY = "eat.remember";

// "Remember me" = persist the session across browser restarts (localStorage).
// Unchecked = session lives only until the tab closes (sessionStorage).
function sessionStore(): Storage {
  return localStorage.getItem(REMEMBER_KEY) === "1" ? localStorage : sessionStorage;
}

function storageGet(key: string): string | null {
  return sessionStorage.getItem(key) ?? localStorage.getItem(key);
}

function storageSet(key: string, value: string | null): void {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
  if (value !== null) {
    if (key === REMEMBER_KEY) {
      localStorage.setItem(key, value);
    } else {
      sessionStore().setItem(key, value);
    }
  }
}

export type Role = "USER" | "ADMIN";

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl: string | null;
  schoolName: string | null;
  className: string | null;
  isActive: boolean;
  emailVerifiedAt: string | null;
  phone: string | null;
  phoneVerifiedAt: string | null;
  interestedTopics: string[];
  education: string | null;
  educationBoard: string | null;
  educationClass: string | null;
  qualification: string | null;
  bio: string | null;
  onboardingDone: boolean;
  createdAt: string;
  isProvider?: boolean;
  hasActiveSubscription?: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  emailSent?: boolean;
  devVerifyUrl?: string;
}

/**
 * Where a signed-in user belongs next. Everyone is a normal user, but the
 * account is only really usable once email, phone and onboarding are done.
 */
export function nextAuthPath(user: User): string {
  if (user.role === "ADMIN") return "/admin";
  if (!user.emailVerifiedAt) return "/verify-email";
  if (!user.phoneVerifiedAt) return "/verify-phone";
  if (!user.onboardingDone) return "/onboarding";
  return "/dashboard";
}

export function updateCachedUser(user: User): void {
  if (typeof window === "undefined") return;
  storageSet(USER_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(AUTH_EVENT));
}

/** Fired whenever the persisted auth state changes (login/logout/profile). */
export const AUTH_EVENT = "eat:auth-changed";

export function subscribeAuth(fn: () => void): () => void {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(AUTH_EVENT, fn);
  return () => window.removeEventListener(AUTH_EVENT, fn);
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return storageGet(ACCESS_KEY);
}

export function getCachedUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = storageGet(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    [sessionStorage, localStorage].forEach((s) => s.removeItem(USER_KEY));
    return null;
  }
}

function persistAuth(auth: AuthResponse | null, remember = true): void {
  if (typeof window === "undefined") return;
  if (auth) {
    storageSet(REMEMBER_KEY, remember ? "1" : "0");
    storageSet(ACCESS_KEY, auth.accessToken);
    storageSet(REFRESH_KEY, auth.refreshToken);
    storageSet(USER_KEY, JSON.stringify(auth.user));
  } else {
    [sessionStorage, localStorage].forEach((s) => {
      s.removeItem(ACCESS_KEY);
      s.removeItem(REFRESH_KEY);
      s.removeItem(USER_KEY);
      s.removeItem(REMEMBER_KEY);
    });
  }
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function persistAuthTokens(auth: AuthResponse, remember = true): void {
  persistAuth(auth, remember);
}

/** Store access/refresh tokens without a cached profile yet (auth callback). */
export function persistSessionTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === "undefined") return;
  storageSet(ACCESS_KEY, accessToken);
  storageSet(REFRESH_KEY, refreshToken);
  window.dispatchEvent(new Event(AUTH_EVENT));
}

export function clearAuth(): void {
  persistAuth(null);
}

export class ApiError extends Error {
  status: number;
  details: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { message: string; details?: unknown };
}

let refreshInFlight: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  refreshInFlight ??= (async () => {
    try {
      const refreshToken = typeof window !== "undefined" ? storageGet(REFRESH_KEY) : null;
      if (!refreshToken) return false;

      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;

      const json = (await res.json()) as ApiEnvelope<AuthResponse>;
      if (!json.success || !json.data) return false;
      persistAuthTokens(json.data, localStorage.getItem(REMEMBER_KEY) === "1");
      return true;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

export async function api<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  if (res.status === 401 && retry && !path.startsWith("/auth/")) {
    const ok = await tryRefresh();
    if (ok) return api<T>(path, init, false);
    clearAuth();
  }

  const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok || !json?.success) {
    throw new ApiError(res.status, json?.error?.message ?? `Request failed (${res.status})`, json?.error?.details);
  }
  return json.data as T;
}
