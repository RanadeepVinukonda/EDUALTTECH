"use client";

import Link from "next/link";
import { Wrench, Menu, Users, LayoutDashboard, GraduationCap, ShoppingBag, LayoutGrid, CreditCard, MessageSquare, Settings, LogOut, ChevronLeft } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, clearAuth, getCachedUser, subscribeAuth, type User } from "@/lib/api";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: { section: string; items: NavItem[] }[] = [
  { section: "Overview", items: [{ href: "/admin", label: "Overview", icon: LayoutDashboard }] },
  {
    section: "Community",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/applications", label: "Applications", icon: GraduationCap },
      { href: "/admin/courses", label: "Courses", icon: Wrench },
    ],
  },
  {
    section: "Content",
    items: [
      { href: "/admin/content", label: "Media & logos", icon: LayoutGrid },
      { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
    ],
  },
  {
    section: "Operations",
    items: [
      { href: "/admin/webhooks", label: "Payments log", icon: CreditCard },
      { href: "/admin/messages", label: "Messages", icon: MessageSquare },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

const ALL_ITEMS = NAV.flatMap((g) => g.items);

function isActive(href: string, pathname: string): boolean {
  return pathname === href || pathname.startsWith(href.replace(/\/$/, "") + "/");
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => setUser(getCachedUser());
    refresh();
    const unsub = subscribeAuth(refresh);
    setChecked(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!user) router.replace("/login");
    else if (user.role !== "ADMIN") router.replace("/dashboard");
  }, [user, checked, router]);

  useEffect(() => setOpen(false), [pathname]);

  const signOut = useCallback(async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    clearAuth();
    window.location.href = "/";
  }, []);

  if (!checked || !user || user.role !== "ADMIN") {
    return <p className="flex min-h-screen items-center justify-center text-sm text-slate-500">Checking access…</p>;
  }

  const sidebar = (
    <nav className="flex h-full flex-col overflow-y-auto border-r border-slate-200 bg-white px-3 py-4">
      <div className="flex items-center justify-between px-2">
        <Link href="/admin" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo.png" alt="Edu Alt Tech" className="h-8 w-auto" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <span className="font-display text-sm font-semibold text-slate-900">Admin</span>
        </Link>
        <button onClick={() => setOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden">
          <ChevronLeft className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-5 flex-1 space-y-5">
        {NAV.map((group) => (
          <div key={group.section}>
            <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">{group.section}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, pathname);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? "bg-brand-600 font-semibold text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <button
        onClick={signOut}
        className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </nav>
  );

  const current = ALL_ITEMS.find((i) => isActive(i.href, pathname));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-60">{sidebar}</aside>
        </div>
      )}

      <div className="lg:pl-60">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <button onClick={() => setOpen(true)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="font-display text-base font-bold text-slate-900">{current?.label ?? "Admin"}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[160px] truncate text-sm font-medium text-slate-600 sm:inline">{user.name}</span>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}