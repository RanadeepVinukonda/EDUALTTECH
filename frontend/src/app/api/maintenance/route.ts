import { createHash, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const COOKIE = "maint_access";

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
    return res;
  }

  res.cookies.set(COOKIE, hash(secret ?? token).toString("hex"), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
