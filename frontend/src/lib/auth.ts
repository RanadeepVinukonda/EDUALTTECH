"use client";

import { getSupabase } from "./supabase";

export const PASSWORD_MIN_LENGTH = 8;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Mirror the backend-issued Supabase tokens into the browser session. */
export async function setSessionFromTokens(tokens: AuthTokens): Promise<void> {
  const { error } = await getSupabase().auth.setSession({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
  });
  if (error) throw error;
}

export async function clearSession(): Promise<void> {
  await getSupabase().auth.signOut();
}

export async function hasSession(): Promise<boolean> {
  const { data } = await getSupabase().auth.getSession();
  return Boolean(data.session);
}

/**
 * Only allow internal, absolute-path redirects. Rejects protocol-relative
 * (`//host`) and external URLs so `?next=` can't bounce users off-site.
 */
export function safeNext(raw: string | null | undefined, fallback = "/"): string {
  if (!raw) return fallback;
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  return raw;
}

export function firstParam(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
