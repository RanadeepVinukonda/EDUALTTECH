"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

interface Tab {
  id: string;
  label: string;
  segment: string;
}

const TABS: Tab[] = [
  { id: "overview", label: "Overview", segment: "" },
  { id: "roadmap", label: "Roadmap", segment: "/roadmap" },
  { id: "meetings", label: "Meetings", segment: "/meetings" },
  { id: "resources", label: "Resources", segment: "/resources" },
];

export default function CourseTabs({ slug }: { slug: string }) {
  const pathname = usePathname() || "";
  const base = `/dashboard/courses/${slug}`;

  function isActive(tab: Tab): boolean {
    if (tab.id === "overview") return pathname === base || pathname === `${base}/`;
    if (tab.id === "roadmap") {
      return pathname.startsWith(`${base}/roadmap`) || pathname.startsWith(`${base}/lessons`);
    }
    return pathname.startsWith(`${base}${tab.segment}`);
  }

  return (
    <nav aria-label="Course sections" className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {TABS.map((t) => {
        const active = isActive(t);
        return (
          <Link
            key={t.id}
            href={`${base}${t.segment}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition",
              active ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-ink-700",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
