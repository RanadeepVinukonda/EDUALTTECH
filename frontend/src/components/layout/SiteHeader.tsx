"use client";

import Link from "next/link";
import { Bell, ChevronDown, LogOut, ShoppingBag, User as UserIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getCachedUser, clearAuth, subscribeAuth, api, type User } from "@/lib/api";

const GUEST_NAV = [
  { href: "/courses", label: "Learn" },
  { href: "/services", label: "Mentorship" },
  { href: "/about", label: "Company" },
];

interface MenuGroup {
  label: string;
  items: { title: string; href: string; description: string }[];
}

const USER_MENU_GROUPS: MenuGroup[] = [
  {
    label: "Learn",
    items: [
      { title: "Courses", href: "/courses", description: "Browse all digital classrooms" },
      { title: "Saved", href: "/saved", description: "Courses you bookmarked" },
      { title: "Resources", href: "/resources", description: "Learning guides & library" },
    ],
  },
  {
    label: "Mentor",
    items: [
      { title: "Mentor workspace", href: "/teacher", description: "Teach & manage your classes" },
      { title: "Practice", href: "/practice", description: "Solve problems & track scores" },
    ],
  },
];

const ACCOUNT_MENU = [
  { href: "/profile", label: "My profile", icon: UserIcon },
  { href: "/orders", label: "My orders", icon: ShoppingBag },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

function isActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(href.replace(/\/$/, "") + "/");
}

function DropdownMenu({
  label,
  items,
  pathname,
}: {
  label: string;
  items: MenuGroup["items"];
  pathname: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const anyActive = items.some((i) => isActive(i.href, pathname));

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={() => setOpen(true)}
        className={`flex items-center gap-1 text-sm ${
          anyActive ? "font-semibold text-brand-700" : "font-medium text-slate-600 hover:text-brand-700"
        }`}
        aria-expanded={open}
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 w-80 pt-3"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`block rounded-lg px-3 py-2 transition ${
                  isActive(item.href, pathname) ? "bg-brand-50" : "hover:bg-slate-50"
                }`}
              >
                <span className={`text-sm font-medium ${isActive(item.href, pathname) ? "text-brand-700" : "text-slate-800"}`}>
                  {item.title}
                </span>
                <span className="block text-xs text-slate-500">{item.description}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UserMenu({ user, onSignOut }: { user: User; onSignOut: () => Promise<void> }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full brand-grad font-display text-sm font-bold text-white"
        aria-label="Account menu"
      >
        {user.name?.[0]?.toUpperCase() ?? "U"}
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>
          {ACCOUNT_MENU.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 px-4 py-2 text-sm ${
                  isActive(item.href, pathname) ? "bg-brand-50 font-semibold text-brand-700" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
          <button
            onClick={async () => {
              setOpen(false);
              await onSignOut();
              router.refresh();
            }}
            className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [logoOk, setLogoOk] = useState(true);

  const refresh = () => setUser(getCachedUser());

  useEffect(() => {
    refresh();
    return subscribeAuth(refresh);
  }, [pathname]);

  if (pathname.startsWith("/admin")) return null;

  const home = user?.role === "ADMIN" ? "/admin" : "/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-4">
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

          {user ? (
            <nav className="hidden items-center gap-6 md:flex">
              <Link
                href="/dashboard"
                className={isActive("/dashboard", pathname) ? "text-sm font-semibold text-brand-700" : "text-sm font-medium text-slate-600 hover:text-brand-700"}
              >
                Dashboard
              </Link>
              {USER_MENU_GROUPS.map((group) => (
                <DropdownMenu key={group.label} label={group.label} items={group.items} pathname={pathname} />
              ))}
              <Link
                href="/messages"
                className={isActive("/messages", pathname) ? "text-sm font-semibold text-brand-700" : "text-sm font-medium text-slate-600 hover:text-brand-700"}
              >
                Messages
              </Link>
            </nav>
          ) : (
            <nav className="hidden items-center gap-6 md:flex">
              {GUEST_NAV.map((item) => (
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
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <UserMenu user={user} onSignOut={() => api("/auth/logout", { method: "POST" }).catch(() => undefined).then(clearAuth)} />
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
          <Link
            href={home}
            className="hidden rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 sm:inline-block"
          >
            {user?.role === "ADMIN" ? "Admin panel" : "Dashboard"}
          </Link>
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="flex gap-4 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
        {user
          ? [
              { href: "/dashboard", label: "Dashboard" },
              { href: "/courses", label: "Courses" },
              { href: "/saved", label: "Saved" },
              { href: "/resources", label: "Resources" },
              { href: "/practice", label: "Practice" },
              { href: "/teacher", label: "Mentor" },
              { href: "/messages", label: "Messages" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive(item.href, pathname)
                    ? "whitespace-nowrap text-sm font-semibold text-brand-700"
                    : "whitespace-nowrap text-sm font-medium text-slate-600"
                }
              >
                {item.label}
              </Link>
            ))
          : GUEST_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={
                  isActive(item.href, pathname)
                    ? "whitespace-nowrap text-sm font-semibold text-brand-700"
                    : "whitespace-nowrap text-sm font-medium text-slate-600"
                }
              >
                {item.label}
              </Link>
            ))}
      </nav>
    </header>
  );
}