"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SpaceDashboard from "@mui/icons-material/SpaceDashboard";
import Insights from "@mui/icons-material/Insights";
import MenuBook from "@mui/icons-material/MenuBook";
import CoPresent from "@mui/icons-material/CoPresent";
import HowToReg from "@mui/icons-material/HowToReg";
import ReceiptLong from "@mui/icons-material/ReceiptLong";
import Webhook from "@mui/icons-material/Webhook";
import Tune from "@mui/icons-material/Tune";
import { useAuth } from "@/components/app/AuthProvider";
import AccessDenied from "@/components/ui/AccessDenied";
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
    label: "Mentoring",
    items: [
      { href: "/dashboard/admin/mentors", label: "Mentors", Icon: CoPresent, exact: false },
      { href: "/dashboard/admin/applications", label: "Applications", Icon: HowToReg, exact: false },
      { href: "/dashboard/admin/cms/work", label: "CMS", Icon: MenuBook, exact: false },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/dashboard/admin/orders", label: "Orders", Icon: ReceiptLong, exact: false },
      { href: "/dashboard/admin/payments", label: "Webhooks", Icon: Webhook, exact: false },
    ],
  },
  {
    label: "System",
    items: [{ href: "/dashboard/admin/settings", label: "Settings", Icon: Tune, exact: false }],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname() || "/dashboard/admin";

  if (loading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner label="Checking access…" />
      </div>
    );
  }
  if (!user) return null;

  if (user.role !== "ADMIN") {
    return <AccessDenied title="Admins only" description="Your account doesn’t have access to the admin console." />;
  }

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition",
      active ? "bg-brand-600 text-white shadow-elev1" : "text-ink-700 hover:bg-slate-100",
    );

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
      <aside className="lg:sticky lg:top-24 lg:w-60 lg:shrink-0">
        <nav aria-label="Admin sections" className="flex flex-col gap-5">
          {GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-3 pb-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">{group.label}</p>
              <div className="flex flex-col gap-0.5">
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