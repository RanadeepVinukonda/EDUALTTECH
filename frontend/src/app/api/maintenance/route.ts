import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COOKIE = "maint_access";
const KEY_COOKIE = "maint_key";

const hash = (value: string) => createHash("sha256").update(value).digest();

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const secret = process.env.MAINTENANCE_TOKEN;
  const isLock = params.get("lock") === "1";
  const token = params.get("token") ?? "";

  if (!isLock) {
    const a = hash(token);
    const b = secret ? hash(secret) : Buffer.alloc(32);
    if (!secret || !timingSafeEqual(a, b)) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const res = NextResponse.redirect(new URL("/", req.nextUrl));

  if (isLock) {
    res.cookies.delete(COOKIE);
    res.cookies.delete(KEY_COOKIE);
    return res;
  }

  const value = hash(secret ?? token).toString("hex");
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  res.cookies.set(KEY_COOKIE, value, {
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
