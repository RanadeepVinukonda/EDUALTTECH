"use client";

import { useMemo, useState } from "react";
import WorkCard from "@/components/landing/WorkCard";
import { cn } from "@/lib/cn";
import type { WorkItem } from "@/lib/types";

export default function WorkBrowser({ items }: { items: WorkItem[] }) {
  const categories = useMemo(() => {
    const set = new Set(items.map((i) => i.category).filter(Boolean));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [items]);

  const [active, setActive] = useState<string>("All");
  const filtered = active === "All" ? items : items.filter((i) => i.category === active);

  return (
    <div>
      {categories.length > 1 && (
        <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter projects by category">
          {["All", ...categories].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setActive(c)}
              aria-pressed={active === c}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40",
                active === c
                  ? "border-brand-600 bg-brand-600 text-white"
                  : "border-slate-300 bg-white text-ink-700 hover:bg-slate-50",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      <p aria-live="polite" className="mb-4 text-sm text-ink-600">
        {filtered.length} {filtered.length === 1 ? "project" : "projects"}
      </p>

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => (
            <WorkCard key={w.id} item={w} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="text-ink-600">No projects in this category.</p>
          <button
            type="button"
            onClick={() => setActive("All")}
            className="mt-4 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Show all projects
          </button>
        </div>
      )}
    </div>
  );
}
