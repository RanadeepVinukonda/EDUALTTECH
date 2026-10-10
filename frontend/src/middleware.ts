import { NextRequest, NextResponse } from "next/server";

const MAINT_COOKIE = "maint_access";

const PASSTHROUGH = ["/_next", "/favicon.ico", "/maintenance", "/api/maintenance"];

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Full-site maintenance lock.
 *
 * Runs on the Node.js runtime (stable in Next 15.5) so `process.env` is read at
 * request time. On the Edge runtime these values are inlined at build time, which
 * made the unlock cookie silently never match — the whole site stayed locked.
 *
 * The lock response is also marked `no-store` + `Vary: Cookie` so the CDN never
 * caches the maintenance page and serves it to an unlocked visitor.
 */
export async function middleware(req: NextRequest) {
  if (process.env.MAINTENANCE_MODE !== "true") {
    return pass("off");
  }

  const { pathname } = req.nextUrl;
  if (PASSTHROUGH.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return pass("passthrough");
  }

  const token = process.env.MAINTENANCE_TOKEN;
  const cookie = req.cookies.get(MAINT_COOKIE)?.value;
  const computed = token ? await sha256Hex(token) : "";
  if (token && cookie && cookie === computed) {
    return pass("bypass");
  }

  const url = req.nextUrl.clone();
  url.pathname = "/maintenance";
  url.search = "";
  const res = NextResponse.rewrite(url);
  res.headers.set(
    "x-maintenance",
    `locked;t=${token ? token.length : 0};c=${cookie ? cookie.length : 0};h=${computed.slice(0, 10)};ck=${(cookie ?? "").slice(0, 10)}`,
  );
  res.headers.set("Cache-Control", "no-store, must-revalidate");
  res.headers.set("Vary", "Cookie");
  return res;
}

function pass(state: string): NextResponse {
  const res = NextResponse.next();
  res.headers.set("x-maintenance", state);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
  runtime: "nodejs",
};
