"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Home from "@mui/icons-material/Home";
import School from "@mui/icons-material/School";
import TrendingUp from "@mui/icons-material/TrendingUp";
import Favorite from "@mui/icons-material/Favorite";
import ReceiptLong from "@mui/icons-material/ReceiptLong";
import CoPresent from "@mui/icons-material/CoPresent";
import VideoCall from "@mui/icons-material/VideoCall";
import LibraryBooks from "@mui/icons-material/LibraryBooks";
import Forum from "@mui/icons-material/Forum";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Person from "@mui/icons-material/Person";
import Settings from "@mui/icons-material/Settings";
import AdminPanelSettings from "@mui/icons-material/AdminPanelSettings";
import Logout from "@mui/icons-material/Logout";
import { useAuth } from "./AuthProvider";
import Spinner from "@/components/ui/Spinner";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/dashboard", label: "Overview", Icon: Home, exact: true },
  { href: "/dashboard/my-learning", label: "My Learning", Icon: School, exact: false },
  { href: "/dashboard/progress", label: "Progress", Icon: TrendingUp, exact: false },
  { href: "/dashboard/wishlist", label: "Wishlist", Icon: Favorite, exact: false },
  { href: "/dashboard/orders", label: "Orders", Icon: ReceiptLong, exact: false },
  { href: "/dashboard/mentor", label: "Mentor", Icon: CoPresent, exact: false },
  { href: "/dashboard/meetings", label: "Meetings", Icon: VideoCall, exact: false },
  { href: "/dashboard/resources", label: "Resources", Icon: LibraryBooks, exact: false },
  { href: "/dashboard/messages", label: "Messages", Icon: Forum, exact: false },
  { href: "/dashboard/notifications", label: "Notifications", Icon: NotificationsIcon, exact: false },
  { href: "/dashboard/profile", label: "Profile", Icon: Person, exact: false },
  { href: "/dashboard/settings", label: "Settings", Icon: Settings, exact: false },
];

const ADMIN_NAV = { href: "/dashboard/admin", label: "Admin", Icon: AdminPanelSettings, exact: true };

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "/dashboard";
  const nav = user?.role === "ADMIN" ? [...NAV, ADMIN_NAV] : NAV;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!user.onboardingDone) router.replace("/onboarding");
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner label="Loading your workspace…" />
      </div>
    );
  }
  if (!user || !user.onboardingDone) return null;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <aside className="hidden w-56 shrink-0 lg:block">
        <nav aria-label="Dashboard" className="sticky top-8 flex flex-col gap-1">
          {nav.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition",
                  active ? "bg-brand-600 text-white shadow-elev1" : "text-ink-700 hover:bg-slate-100",
                )}
              >
                <Icon fontSize="small" aria-hidden />
                {label}
              </Link>
            );
          })}
          <button type="button" onClick={() => void signOut().then(() => router.replace("/"))} className={buttonClass("ghost", "sm", "mt-2 justify-start")}>
            <Logout fontSize="small" aria-hidden />
            Sign out
          </button>
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <nav aria-label="Dashboard" className="mb-6 flex gap-1 overflow-x-auto lg:hidden">
          {nav.map(({ href, label, Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition",
                  active ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700",
                )}
              >
                <Icon sx={{ fontSize: 18 }} aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
        {children}
      </div>
    </div>
  );
}
