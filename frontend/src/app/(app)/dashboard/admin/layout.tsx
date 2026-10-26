"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SpaceDashboard from "@mui/icons-material/SpaceDashboard";
import Insights from "@mui/icons-material/Insights";
import MenuBook from "@mui/icons-material/MenuBook";
import CoPresent from "@mui/icons-material/CoPresent";
import HowToReg from "@mui/icons-material/HowToReg";
import ReceiptLong from "@mui/icons-material/ReceiptLong";
import Tune from "@mui/icons-material/Tune";
import PeopleAlt from "@mui/icons-material/PeopleAlt";
import Web from "@mui/icons-material/Web";
import History from "@mui/icons-material/History";
import { useAuth } from "@/components/app/AuthProvider";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

interface TabItem {
  href: string;
  label: string;
  Icon: typeof SpaceDashboard;
  exact?: boolean;
}

interface TabGroup {
  label: string;
  items: TabItem[];
}

const GROUPS: TabGroup[] = [
  {
    label: "Main",
    items: [
      { href: "/dashboard/admin", label: "Overview", Icon: SpaceDashboard, exact: true },
      { href: "/dashboard/admin/analytics", label: "Analytics", Icon: Insights, exact: false },
      { href: "/dashboard/admin/courses", label: "Courses", Icon: MenuBook, exact: false },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/dashboard/admin/users", label: "Users", Icon: PeopleAlt, exact: false },
      { href: "/dashboard/admin/mentors", label: "Mentors", Icon: CoPresent, exact: false },
      { href: "/dashboard/admin/applications", label: "Applications", Icon: HowToReg, exact: false },
    ],
  },
  {
    label: "CMS",
    items: [
      { href: "/dashboard/admin/cms", label: "Website CMS", Icon: Web, exact: false },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/dashboard/admin/orders", label: "Orders", Icon: ReceiptLong, exact: false },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/dashboard/admin/audit", label: "Audit log", Icon: History, exact: false },
      { href: "/dashboard/admin/settings", label: "Settings", Icon: Tune, exact: false },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname() || "/dashboard/admin";

  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!loading && user && !isAdmin) router.replace("/dashboard");
  }, [loading, user, isAdmin, router]);

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner label="Checking access…" />
      </div>
    );
  }
  if (!user) return null;

  if (!isAdmin) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner label="Redirecting…" />
      </div>
    );
  }

  const linkClass = (active: boolean) =>
    cn(
      "flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-semibold transition",
      active ? "bg-brand-600 text-white shadow-elev1" : "text-ink-700 hover:bg-slate-100",
    );

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <aside className="min-w-0 lg:sticky lg:top-24 lg:w-60 lg:shrink-0">
        <nav
          aria-label="Admin sections"
          className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:gap-5 lg:overflow-visible lg:pb-0"
        >
          {GROUPS.map((group) => (
            <div key={group.label} className="contents lg:block">
              <p className="hidden px-3 pb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400 lg:block">
                {group.label}
              </p>
              <div className="flex shrink-0 gap-1 lg:flex-col lg:gap-0.5">
                {group.items.map(({ href, label, Icon, exact }) => {
                  const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Link
                      key={href}
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={linkClass(active)}
                    >
                      <Icon sx={{ fontSize: 18 }} aria-hidden />
                      {label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}