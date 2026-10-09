"use client";

import { useMemo, useState } from "react";
import Search from "@mui/icons-material/Search";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { cn } from "@/lib/cn";

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: React.ReactNode;
}

export default function FaqBrowser({ items }: { items: FaqItem[] }) {
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("All");

  const normalized = query.trim().toLowerCase();
  const filtered = items.filter((i) => {
    if (active !== "All" && i.category !== active) return false;
    if (!normalized) return true;
    return i.question.toLowerCase().includes(normalized);
  });

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <label htmlFor="faq-search" className="sr-only">
            Search frequently asked questions
          </label>
          <Search
            fontSize="small"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            id="faq-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions"
            className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-[15px] text-ink-900 placeholder:text-slate-400 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
          />
        </div>
      </div>

      {categories.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
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

      <p aria-live="polite" className="mt-6 text-sm text-ink-600">
        {filtered.length} {filtered.length === 1 ? "question" : "questions"}
      </p>

      {filtered.length > 0 ? (
        <ul className="mt-4 space-y-3">
          {filtered.map((item) => (
            <li key={item.id}>
              <details className="group rounded-2xl border border-slate-200 bg-white">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-2xl px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40">
                  <span className="font-semibold text-ink-900">{item.question}</span>
                  <ExpandMore
                    fontSize="small"
                    className="shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                  />
                </summary>
                <div className="border-t border-slate-100 px-5 py-4 text-sm leading-relaxed text-ink-700">
                  {item.answer}
                </div>
              </details>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <p className="text-ink-600">No questions match your search.</p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setActive("All");
            }}
            className="mt-4 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
