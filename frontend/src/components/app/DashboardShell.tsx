"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Home from "@mui/icons-material/Home";
import MenuBook from "@mui/icons-material/MenuBook";
import PlayCircle from "@mui/icons-material/PlayCircle";
import CoPresent from "@mui/icons-material/CoPresent";
import ReceiptLong from "@mui/icons-material/ReceiptLong";
import Favorite from "@mui/icons-material/Favorite";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Person from "@mui/icons-material/Person";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandMore from "@mui/icons-material/ExpandMore";
import SpaceDashboard from "@mui/icons-material/SpaceDashboard";
import HowToVote from "@mui/icons-material/HowToVote";
import Insights from "@mui/icons-material/Insights";
import LibraryBooks from "@mui/icons-material/LibraryBooks";
import PeopleAlt from "@mui/icons-material/PeopleAlt";
import HowToReg from "@mui/icons-material/HowToReg";
import MarkEmailUnread from "@mui/icons-material/MarkEmailUnread";
import Web from "@mui/icons-material/Web";
import History from "@mui/icons-material/History";
import ArrowOutward from "@mui/icons-material/ArrowOutward";
import { apiGet, NOTIFICATIONS_CHANGED_EVENT } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/name";
import BrandLogo from "@/components/brand/BrandLogo";

interface NavLink {
  href: string;
  label: string;
  Icon: typeof MenuBook;
  exact?: boolean;
}

interface NavGroup {
  label?: string;
  items: NavLink[];
}

const LEARNER_GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/dashboard", label: "Home", Icon: Home, exact: true },
      { href: "/dashboard/my-learning", label: "My learning", Icon: PlayCircle },
      { href: "/dashboard/courses", label: "Browse courses", Icon: MenuBook },
    ],
  },
  {
    label: "Teaching",
    items: [{ href: "/dashboard/mentor", label: "Mentor hub", Icon: CoPresent }],
  },
  {
    label: "Community",
    items: [
      { href: "/polls", label: "Course polls", Icon: HowToVote },
      { href: "/resources", label: "Free resources", Icon: LibraryBooks },
      { href: "/dashboard/orders", label: "Orders", Icon: ReceiptLong },
      { href: "/dashboard/wishlist", label: "Wishlist", Icon: Favorite },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/dashboard/profile", label: "Profile", Icon: Person },
      { href: "/dashboard/settings", label: "Settings", Icon: SettingsIcon },
    ],
  },
];

const ADMIN_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { href: "/dashboard/admin", label: "Overview", Icon: SpaceDashboard, exact: true },
      { href: "/dashboard/admin/analytics", label: "Analytics", Icon: Insights },
      { href: "/dashboard/admin/courses", label: "Courses", Icon: MenuBook },
      { href: "/dashboard/admin/resources", label: "Resources", Icon: LibraryBooks },
      { href: "/dashboard/admin/polls", label: "Course polling", Icon: HowToVote },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/dashboard/admin/users", label: "Users", Icon: PeopleAlt },
      { href: "/dashboard/admin/mentors", label: "Mentors", Icon: CoPresent },
      { href: "/dashboard/admin/applications", label: "Applications", Icon: HowToReg },
      { href: "/dashboard/admin/inquiries", label: "Tuition inquiries", Icon: MarkEmailUnread },
    ],
  },
  {
    label: "Website",
    items: [{ href: "/dashboard/admin/cms", label: "Website CMS", Icon: Web }],
  },
  {
    label: "Commerce",
    items: [{ href: "/dashboard/admin/orders", label: "Orders", Icon: ReceiptLong }],
  },
  {
    label: "System",
    items: [
      { href: "/dashboard/admin/audit", label: "Audit log", Icon: History },
      { href: "/dashboard/admin/settings", label: "Settings", Icon: SettingsIcon },
    ],
  },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut, isSigningOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "/dashboard";

  const isAdmin = user?.role === "ADMIN";
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (isSigningOut()) return;
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!user.onboardingDone) {
      router.replace("/onboarding");
    }
  }, [loading, user, pathname, router, isSigningOut]);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const loadUnread = () =>
      apiGet<{ unread: number }>("/notifications")
        .then((d) => {
          if (alive) setUnread(d.unread ?? 0);
        })
        .catch(() => undefined);
    void loadUnread();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, loadUnread);
    return () => {
      alive = false;
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, loadUnread);
    };
  }, [user]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center bg-white">
        <Spinner label="Loading your workspace..." />
      </div>
    );
  }

  const groups = isAdmin ? ADMIN_GROUPS : LEARNER_GROUPS;
  const brandHref = isAdmin ? "/dashboard/admin" : "/dashboard";
  const mobilePrimary = isAdmin ? [] : LEARNER_GROUPS[0].items;

  const isActive = (link: NavLink) =>
    link.exact || link.href === "/dashboard"
      ? pathname === link.href
      : pathname === link.href || pathname.startsWith(`${link.href}/`);

  return (
    <div className="flex min-h-dvh bg-slate-50">
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <Link href={brandHref} className="flex min-w-0 items-center gap-2" aria-label="EduAltTech">
            <BrandLogo withWordmark wordmarkClassName="text-sm" />
          </Link>
        </div>

        <nav aria-label="Workspace" className="flex-1 overflow-y-auto px-3 py-5">
          {groups.map((group, i) => (
            <div key={group.label ?? i} className={i > 0 ? "mt-6" : undefined}>
              {group.label && (
                <p className="mb-1.5 px-3 text-[11px] font-semibold text-slate-400">{group.label}</p>
              )}
              <ul className="space-y-0.5">
                {group.items.map((link) => {
                  const active = isActive(link);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block rounded-md px-3 py-2 text-sm transition-colors",
                          active
                            ? "bg-slate-100 font-semibold text-ink-900"
                            : "text-slate-600 hover:bg-slate-50 hover:text-ink-900",
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <Link
            href="/"
            className="flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-ink-900"
          >
            View public site
            <ArrowOutward sx={{ fontSize: 15 }} aria-hidden />
          </Link>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-14 items-center gap-2 px-4 sm:px-6 lg:px-10">
            <Link href={brandHref} className="flex min-w-0 items-center gap-2 lg:hidden" aria-label="EduAltTech">
              <BrandLogo withWordmark wordmarkClassName="text-sm" />
            </Link>

            <div className="ml-auto flex items-center gap-1 sm:gap-2">
              <Link
                href="/dashboard/notifications"
                aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
                className="relative grid h-9 w-9 place-items-center rounded-md text-slate-600 transition hover:bg-slate-100 hover:text-ink-900"
              >
                <NotificationsIcon fontSize="small" aria-hidden />
                {unread > 0 && (
                  <span className="absolute right-1 top-1 grid h-3.5 min-w-3.5 place-items-center rounded-full bg-brand-600 px-1 text-[9px] font-semibold leading-none text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>

              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  className="flex items-center gap-1.5 rounded-full p-0.5 pr-1 transition hover:bg-slate-100"
                >
                  {user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700">
                      {initials(user.firstName, user.lastName)}
                    </span>
                  )}
                  <ExpandMore fontSize="small" aria-hidden className="text-slate-400" />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 mt-2 w-60 overflow-hidden rounded-lg border border-slate-200 bg-white py-1.5 shadow-elev3"
                  >
                    <div className="border-b border-slate-100 px-4 pb-3 pt-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold text-ink-900">{user.name}</p>
                        {isAdmin && (
                          <span className="shrink-0 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                            Admin
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-slate-500">{user.email}</p>
                    </div>
                    {isAdmin && (
                      <Link
                        href="/dashboard/admin"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-ink-700 hover:bg-slate-50"
                      >
                        Admin console
                      </Link>
                    )}
                    {!isAdmin && (
                      <>
                        <Link href="/polls" role="menuitem" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-ink-700 hover:bg-slate-50">
                          Course polls
                        </Link>
                        <Link href="/dashboard/profile" role="menuitem" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-ink-700 hover:bg-slate-50">
                          Profile
                        </Link>
                      </>
                    )}
                    <Link
                      href={isAdmin ? "/dashboard/admin/settings" : "/dashboard/settings"}
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-ink-700 hover:bg-slate-50"
                    >
                      Settings
                    </Link>
                    <div className="my-1.5 border-t border-slate-100" />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void signOut().then(() => router.replace("/"))}
                      className="block w-full px-4 py-2 text-left text-sm text-slate-600 hover:bg-slate-50 hover:text-ink-900"
                    >
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isAdmin && (
            <nav
              aria-label="Admin sections"
              className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 py-2 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden"
            >
              {ADMIN_GROUPS.flatMap((group) => group.items).map((link) => {
                const active = isActive(link);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "whitespace-nowrap rounded-md px-3 py-1.5 text-sm",
                      active ? "bg-slate-100 font-semibold text-ink-900" : "text-slate-600",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-7 sm:px-6 lg:px-10 lg:pb-12">
          {children}
        </main>

        {!isAdmin && mobilePrimary.length > 0 && (
          <nav
            aria-label="Primary mobile"
            className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
          >
            <ul className="mx-auto grid max-w-sm grid-cols-3 px-2 py-1">
              {mobilePrimary.map((link) => {
                const active = isActive(link);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 rounded-md py-2 text-[11px] font-medium transition",
                        active ? "text-ink-900" : "text-slate-500",
                      )}
                    >
                      <link.Icon sx={{ fontSize: 20 }} aria-hidden />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}
