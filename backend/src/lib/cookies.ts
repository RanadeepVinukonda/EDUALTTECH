import type { Request, Response } from "express";
import { config } from "../config/env.js";

export const ACCESS_COOKIE = "eat.access";
export const REFRESH_COOKIE = "eat.refresh";

const MAX_AGE_ACCESS = 60 * 60; // 1h, mirrors access_token lifetime
const MAX_AGE_REFRESH = 60 * 60 * 24 * 30; // 30d

/** Read a single cookie value without pulling in a dependency. */
export function getCookie(req: Request, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return null;
}

function cookieHeader(name: string, value: string, maxAge: number): string {
  const secure = config.isProd ? "; Secure" : "";
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.append("Set-Cookie", cookieHeader(ACCESS_COOKIE, accessToken, MAX_AGE_ACCESS));
  res.append("Set-Cookie", cookieHeader(REFRESH_COOKIE, refreshToken, MAX_AGE_REFRESH));
}

export function clearAuthCookies(res: Response): void {
  res.append("Set-Cookie", `${ACCESS_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
  res.append("Set-Cookie", `${REFRESH_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`);
}