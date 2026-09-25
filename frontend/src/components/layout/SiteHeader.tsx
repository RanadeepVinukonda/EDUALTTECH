"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCachedUser, clearAuth, subscribeAuth, api, type User } from "@/lib/api";

const GUEST_NAV = [
  { href: "/courses", label: "Learn" },
  { href: "/services", label: "Mentorship" },
  { href: "/about", label: "Company" },
];

const USER_NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/courses", label: "Courses" },
  { href: "/practice", label: "Practice" },
  { href: "/messages", label: "Messages" },
];

function isActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(href.replace(/\/$/, "") + "/");
}

function NavLinks({ user, pathname }: { user: User | null; pathname: string }) {
  const items = user ? USER_NAV : GUEST_NAV;
  return (
    <>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={
            isActive(item.href, pathname)
              ? "text-sm font-semibold text-brand-700"
              : "text-sm font-medium text-slate-600 hover:text-brand-700"
          }
        >
          {item.label}
        </Link>
      ))}
    </>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [logoOk, setLogoOk] = useState(true);

  const refresh = () => setUser(getCachedUser());

  useEffect(() => {
    refresh();
    return subscribeAuth(refresh);
  }, [pathname, router]);

  if (pathname.startsWith("/admin")) return null;

  const home = user?.role === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          {logoOk ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo.png"
                alt="Edu-Alt-Tech"
                className="h-9 w-auto"
                onError={() => setLogoOk(false)}
                data-logo
              />
              <span className="font-display text-lg font-semibold text-slate-900">Edu-Alt-Tech</span>
            </>
          ) : (
            <span className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg brand-grad font-display text-lg font-bold text-white">
                E
              </span>
              <span className="font-display text-lg font-semibold text-slate-900">Edu-Alt-Tech</span>
            </span>
          )}
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <NavLinks user={user} pathname={pathname} />
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden flex-col items-end leading-tight md:flex">
                <span className="max-w-[140px] truncate text-sm font-semibold text-slate-800">{user.name}</span>
              </span>
              <Link
                href={home}
                className={
                  isActive(home, pathname)
                    ? "hidden sm:inline-block rounded-lg brand-grad px-4 py-2 text-sm font-semibold text-white opacity-90"
                    : "hidden sm:inline-block rounded-lg brand-grad px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                }
              >
                Dashboard
              </Link>
              <Link
                href="/notifications"
                aria-label="Notifications"
                title="Notifications"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
              >
                <Bell className="h-5 w-5" />
              </Link>
              <button
                onClick={async () => {
                  // Revoke the Supabase session server-side, then drop local state.
                  await api("/auth/logout", { method: "POST" }).catch(() => undefined);
                  clearAuth();
                  window.location.href = "/";
                }}
                className="text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-brand-700">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-lg brand-grad px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex gap-4 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
        <NavLinks user={user} pathname={pathname} />
      </nav>
    </header>
  );
}