"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/dashboard/admin/cms", label: "Overview", exact: true },
  { href: "/dashboard/admin/cms/work", label: "Work", exact: false },
  { href: "/dashboard/admin/cms/partners", label: "Partners", exact: false },
  { href: "/dashboard/admin/cms/programs", label: "Programs", exact: false },
  { href: "/dashboard/admin/cms/team", label: "Team", exact: false },
  { href: "/dashboard/admin/cms/media", label: "Media", exact: false },
];

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/dashboard/admin/cms";
  return (
    <div className="space-y-6">
      <nav aria-label="CMS sections" className="flex gap-1 overflow-x-auto">
        {TABS.map(({ href, label, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center rounded-full px-4 py-1.5 text-sm font-semibold transition",
                active ? "bg-brand-50 text-brand-700" : "text-slate-500 hover:bg-slate-100 hover:text-ink-900",
              )}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
