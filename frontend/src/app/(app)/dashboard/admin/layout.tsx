"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import SpaceDashboard from "@mui/icons-material/SpaceDashboard";
import Insights from "@mui/icons-material/Insights";
import People from "@mui/icons-material/People";
import MenuBook from "@mui/icons-material/MenuBook";
import Article from "@mui/icons-material/Article";
import Layers from "@mui/icons-material/Layers";
import HowToReg from "@mui/icons-material/HowToReg";
import CoPresent from "@mui/icons-material/CoPresent";
import ReceiptLong from "@mui/icons-material/ReceiptLong";
import Webhook from "@mui/icons-material/Webhook";
import MarkEmailUnread from "@mui/icons-material/MarkEmailUnread";
import History from "@mui/icons-material/History";
import Tune from "@mui/icons-material/Tune";
import { useAuth } from "@/components/app/AuthProvider";
import AccessDenied from "@/components/ui/AccessDenied";
import Spinner from "@/components/ui/Spinner";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/dashboard/admin", label: "Overview", Icon: SpaceDashboard, exact: true },
  { href: "/dashboard/admin/analytics", label: "Analytics", Icon: Insights, exact: false },
  { href: "/dashboard/admin/users", label: "Users", Icon: People, exact: false },
  { href: "/dashboard/admin/courses", label: "Courses", Icon: MenuBook, exact: false },
  { href: "/dashboard/admin/content", label: "Content", Icon: Article, exact: false },
  { href: "/dashboard/admin/cms", label: "CMS", Icon: Layers, exact: false },
  { href: "/dashboard/admin/applications", label: "Applications", Icon: HowToReg, exact: false },
  { href: "/dashboard/admin/mentors", label: "Mentors", Icon: CoPresent, exact: false },
  { href: "/dashboard/admin/orders", label: "Orders", Icon: ReceiptLong, exact: false },
  { href: "/dashboard/admin/payments", label: "Webhooks", Icon: Webhook, exact: false },
  { href: "/dashboard/admin/inbox", label: "Inbox", Icon: MarkEmailUnread, exact: false },
  { href: "/dashboard/admin/audit", label: "Audit", Icon: History, exact: false },
  { href: "/dashboard/admin/settings", label: "Settings", Icon: Tune, exact: false },
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
    return (
      <AccessDenied
        title="Admins only"
        description="Your account doesn’t have access to the admin console. Access is enforced by the backend independently of this page."
      />
    );
  }

  return (
    <div className="space-y-6">
      <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
        {TABS.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold transition",
                active ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-ink-900",
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
  );
}
