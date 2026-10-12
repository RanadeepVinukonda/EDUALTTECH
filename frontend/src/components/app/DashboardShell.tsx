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
import Logout from "@mui/icons-material/Logout";
import ExpandMore from "@mui/icons-material/ExpandMore";
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

const ACCOUNT: NavLink[] = [
  { href: "/dashboard/orders", label: "Orders", Icon: ReceiptLong },
  { href: "/dashboard/wishlist", label: "Wishlist", Icon: Favorite },
];

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "/dashboard";

  const isAdmin = user?.role === "ADMIN";
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!user.onboardingDone) router.replace("/onboarding");
  }, [loading, user, pathname, router]);

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

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner label="Loading your workspace…" />
      </div>
    );
  }
  if (!user || !user.onboardingDone) return null;

  const primary: NavLink[] = isAdmin
    ? []
    : [
        { href: "/dashboard", label: "Home", Icon: Home },
        { href: "/dashboard/courses", label: "Courses", Icon: MenuBook },
        { href: "/dashboard/my-learning", label: "Learn", Icon: PlayCircle },
        { href: "/dashboard/mentor", label: "Mentor", Icon: CoPresent },
      ];
  const secondary = isAdmin ? [] : ACCOUNT;
  const brandHref = isAdmin ? "/dashboard/admin" : "/dashboard";

  const isActive = (link: NavLink) =>
    link.href === "/dashboard" || link.exact
      ? pathname === link.href
      : pathname === link.href || pathname.startsWith(`${link.href}/`);

  const linkClass = (active: boolean) =>
    cn(
      "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
      active ? "bg-brand-600 text-white shadow-elev1" : "text-ink-700 hover:bg-slate-100",
    );

  const links = [...primary, ...secondary];

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
          <Link href={brandHref} className="flex shrink-0 items-center gap-2" aria-label="EduAltTech">
            <BrandLogo withWordmark wordmarkClassName="hidden sm:inline" />
          </Link>

          <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 lg:flex">
            {primary.map((link) => (
              <Link key={link.label} href={link.href} className={linkClass(isActive(link))} aria-current={isActive(link) ? "page" : undefined}>
                <link.Icon fontSize="small" aria-hidden />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <nav aria-label="Shortcuts" className="hidden items-center gap-1 xl:flex">
              {secondary.map((link) => (
                <Link key={link.href} href={link.href} className={linkClass(isActive(link))} aria-current={isActive(link) ? "page" : undefined}>
                  <link.Icon fontSize="small" aria-hidden />
                  {link.label}
                </Link>
              ))}
            </nav>

            <Link
              href="/dashboard/notifications"
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
              className="relative grid h-10 w-10 place-items-center rounded-xl text-ink-700 transition hover:bg-slate-100"
            >
              <NotificationsIcon fontSize="small" aria-hidden />
              {unread > 0 && (
                <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white">
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
                className="flex items-center gap-1.5 rounded-full p-0.5 pr-1.5 transition hover:bg-slate-100"
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {initials(user.firstName, user.lastName)}
                  </span>
                )}
                <ExpandMore fontSize="small" aria-hidden className="text-ink-500" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-elev3"
                >
                  <div className="border-b border-slate-100 px-4 pb-2 pt-1">
                    <p className="truncate font-semibold text-ink-900">{user.name}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                  <Link href="/dashboard/profile" role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-slate-50">
                    <Person fontSize="small" aria-hidden /> Profile
                  </Link>
                  <Link href={isAdmin ? "/dashboard/admin/settings" : "/dashboard/settings"} role="menuitem" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-ink-700 hover:bg-slate-50">
                    <SettingsIcon fontSize="small" aria-hidden /> Settings
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => void signOut().then(() => router.replace("/"))}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger/5"
                  >
                    <Logout fontSize="small" aria-hidden /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {links.length > 0 && (
          <nav aria-label="Primary mobile" className="flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
            {links.map((link) => (
              <Link key={link.label} href={link.href} className={linkClass(isActive(link))} aria-current={isActive(link) ? "page" : undefined}>
                <link.Icon sx={{ fontSize: 18 }} aria-hidden />
                {link.label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</div>
    </div>
  );
}
