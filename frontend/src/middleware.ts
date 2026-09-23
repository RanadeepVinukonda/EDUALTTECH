import { NextRequest, NextResponse } from "next/server";

const MAINTENANCE = process.env.MAINTENANCE_MODE === "1";
const TOKEN = process.env.MAINTENANCE_TOKEN ?? "";

export function middleware(req: NextRequest) {
  if (!MAINTENANCE) return NextResponse.next();

  const { pathname, searchParams } = req.nextUrl;

  // Owner unlock: /?token=SECRET sets the cookie, then lands on the app.
  const token = searchParams.get("token");
  if (token && TOKEN && token === TOKEN) {
    const next = req.nextUrl.clone();
    next.search = "";
    const res = NextResponse.redirect(next);
    res.cookies.set("maintenance_token", TOKEN, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 14, // 14 days
      path: "/",
    });
    return res;
  }

  // Owner already unlocked this browser.
  if (req.cookies.get("maintenance_token")?.value === TOKEN) {
    return NextResponse.next();
  }

  // Everyone else sees the under-construction page.
  const maintenance = new URL("/maintenance", req.url);
  return NextResponse.rewrite(maintenance);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand|static|school_logos|og-image.jpg|icon|robots.txt).*)"],
};