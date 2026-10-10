import { getSupabase } from "./supabase";

const BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/backend";

const MAINT_KEY_COOKIE = "maint_key";

/** Reads the unlock cookie and returns the value, or undefined when missing. */
function maintKey(): string | undefined {
  if (typeof document === "undefined") return undefined;
  for (const part of document.cookie.split(";")) {
    const s = part.trim();
    if (s.startsWith(`${MAINT_KEY_COOKIE}=`)) return s.slice(MAINT_KEY_COOKIE.length + 1);
  }
  return undefined;
}

/** Fired when the backend rejects a request as unauthenticated. Consumed once by the session watcher. */
export const SESSION_EXPIRED_EVENT = "edu:session-expired";

function signalSessionExpired(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export interface ApiErrorShape {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;
  requestId?: string;

  constructor(status: number, error: ApiErrorShape) {
    super(error.message || "Request failed");
    this.name = "ApiError";
    this.status = status;
    this.code = error.code;
    this.details = error.details;
    this.requestId = error.requestId;
  }
}

type Envelope<T> = { success: true; data: T } | { success: false; error: ApiErrorShape };

export interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
}

function withQuery(path: string, query?: ApiOptions["query"]): string {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined && v !== null && v !== "") params.set(k, String(v));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const headers = new Headers(opts.headers);
  if (opts.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (opts.auth !== false) {
    const { data } = await getSupabase().auth.getSession();
    const token = data.session?.access_token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }
  const key = maintKey();
  if (key) headers.set("x-maintenance-token", key);

  let res: Response;
  try {
    res = await fetch(`${BASE}${withQuery(path, opts.query)}`, {
      ...opts,
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch (err) {
    // Transport failure / offline / aborted — not an authoritative backend response.
    if (err instanceof DOMException && err.name === "AbortError") throw err;
    throw new ApiError(0, { code: "NETWORK", message: "Could not reach the server." });
  }

  const payload = (await res.json().catch(() => null)) as Envelope<T> | null;

  if (!payload) {
    throw new ApiError(res.status, { code: "INVALID_RESPONSE", message: `Unexpected response (${res.status})` });
  }
  if (!payload.success) {
    if (res.status === 401 || payload.error.code === "UNAUTHORIZED") signalSessionExpired();
    throw new ApiError(res.status, payload.error);
  }
  return payload.data;
}

export const apiGet = <T = unknown>(path: string, query?: ApiOptions["query"]) => api<T>(path, { method: "GET", query });
export const apiPost = <T = unknown>(path: string, body?: unknown, opts: ApiOptions = {}) =>
  api<T>(path, { ...opts, method: "POST", body });
export const apiPatch = <T = unknown>(path: string, body?: unknown, opts: ApiOptions = {}) =>
  api<T>(path, { ...opts, method: "PATCH", body });
export const apiDelete = <T = unknown>(path: string, opts: ApiOptions = {}) => api<T>(path, { ...opts, method: "DELETE" });
