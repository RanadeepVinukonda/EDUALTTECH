"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Search from "@mui/icons-material/Search";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { cn } from "@/lib/cn";
import Skeleton from "@/components/ui/Skeleton";

export interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: React.ReactNode;
}

function FaqBrowserSkeleton() {
  return (
    <div aria-hidden>
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="mt-4 flex flex-wrap gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>
      <div className="mt-6 space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

function FaqBrowserView({ items }: { items: FaqItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category))), [items]);

  const urlQuery = searchParams.get("q") ?? "";
  const urlCategory = searchParams.get("category") ?? "";

  const [query, setQuery] = useState(urlQuery);
  const [category, setCategory] = useState(urlCategory);
  const trimmed = query.trim();
  const active = category || "All";

  // Writes both owned params so a debounced search can never drop a category click.
  const writeParams = useCallback(
    (q: string, cat: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      if (q) sp.set("q", q);
      else sp.delete("q");
      if (cat) sp.set("category", cat);
      else sp.delete("category");
      const qs = sp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  // Keep the controls in sync when the URL changes (back/forward, reset).
  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    setCategory(urlCategory && categories.includes(urlCategory) ? urlCategory : "");
  }, [urlCategory, categories]);

  // Debounced search → URL.
  useEffect(() => {
    if (trimmed === urlQuery) return;
    const h = setTimeout(() => writeParams(trimmed, category), 350);
    return () => clearTimeout(h);
  }, [trimmed, urlQuery, category, writeParams]);

  const normalized = trimmed.toLowerCase();
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
              onClick={() => {
                const next = c === "All" ? "" : c;
                setCategory(next);
                writeParams(trimmed, next);
              }}
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
              setCategory("");
              writeParams("", "");
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

export default function FaqBrowser({ items }: { items: FaqItem[] }) {
  return (
    <Suspense fallback={<FaqBrowserSkeleton />}>
      <FaqBrowserView items={items} />
    </Suspense>
  );
}
