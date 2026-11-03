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
    <nav aria-label="Course sections" className="sticky top-14 z-30 flex gap-1 overflow-x-auto border-b border-rule bg-paper/95 backdrop-blur">
      {TABS.map((t) => {
        const active = isActive(t);
        return (
          <Link
            key={t.id}
            href={`${base}${t.segment}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px flex min-h-11 shrink-0 items-center border-b-2 px-4 py-2 text-sm font-semibold transition",
              active ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
