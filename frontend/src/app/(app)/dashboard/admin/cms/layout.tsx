"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const TABS = [
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
      <nav
        aria-label="CMS sections"
        className="flex gap-1 overflow-x-auto border-b border-slate-200"
      >
        {TABS.map(({ href, label, exact }) => {
          const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex min-h-11 shrink-0 items-center border-b-2 px-4 py-2 text-sm font-semibold transition",
                active
                  ? "border-ink-900 text-ink-900"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-ink-900",
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
