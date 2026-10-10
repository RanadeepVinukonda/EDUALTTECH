import { NextRequest, NextResponse } from "next/server";

const MAINT_COOKIE = "maint_access";

const PASSTHROUGH = ["/_next", "/favicon.ico", "/maintenance", "/api/maintenance"];

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function middleware(req: NextRequest) {
  if (process.env.MAINTENANCE_MODE !== "true") return NextResponse.next();

  const { pathname } = req.nextUrl;
  if (PASSTHROUGH.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const token = process.env.MAINTENANCE_TOKEN;
  const cookie = req.cookies.get(MAINT_COOKIE)?.value;
  if (token && cookie && cookie === (await sha256Hex(token))) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/maintenance";
  url.search = "";
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
