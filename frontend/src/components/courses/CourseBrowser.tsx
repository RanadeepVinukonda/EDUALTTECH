"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Search from "@mui/icons-material/Search";
import Close from "@mui/icons-material/Close";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { api, ApiError } from "@/lib/api";
import type { CourseListItem } from "@/lib/types";
import CourseCard from "@/components/landing/CourseCard";
import { cn } from "@/lib/cn";

const LIMIT = 12;
const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

interface ListResponse {
  items: CourseListItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

function SkeletonGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border border-slate-200">
          <div className="aspect-[16/10] w-full animate-pulse bg-slate-200" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
            <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CourseBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category") ?? "";
  const rawSort = searchParams.get("sort") ?? "";
  const sort = (SORTS.some((s) => s.value === rawSort) ? rawSort : "newest") as string;
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const hasFilters = Boolean(q || category || rawSort || page > 1);

  const [term, setTerm] = useState(q);
  const [categories, setCategories] = useState<string[]>([]);
  const [items, setItems] = useState<CourseListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const replaceParams = useCallback(
    (next: Record<string, string | undefined>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(next)) {
        if (v === undefined || v === "") sp.delete(k);
        else sp.set(k, v);
      }
      const qs = sp.toString();
      router.replace(qs ? `/courses?${qs}` : "/courses", { scroll: false });
    },
    [router, searchParams],
  );

  // Keep the search box in sync when the URL changes (back/forward, reset).
  useEffect(() => {
    setTerm(q);
  }, [q]);

  // Debounced search → URL.
  useEffect(() => {
    if (term === q) return;
    const h = setTimeout(() => replaceParams({ q: term.trim() || undefined, page: undefined }), 350);
    return () => clearTimeout(h);
  }, [term, q, replaceParams]);

  // Categories (public, fetched once).
  useEffect(() => {
    api<{ categories: string[] }>("/courses/categories", { method: "GET", auth: false })
      .then((d) => setCategories(d.categories))
      .catch(() => setCategories([]));
  }, []);

  // Course list — aborts the previous request so stale results never win.
  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    api<ListResponse>("/courses", {
      method: "GET",
      auth: false,
      signal: ctrl.signal,
      query: { q: q || undefined, category: category || undefined, sort, page, limit: LIMIT },
    })
      .then((d) => {
        setItems(d.items);
        setTotal(d.total);
        setHasMore(d.hasMore);
      })
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(e instanceof ApiError ? e.message : "Could not load courses. Please try again.");
        setItems([]);
        setTotal(0);
        setHasMore(false);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [q, category, sort, page, nonce]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const showNoResults = !loading && !error && total === 0 && hasFilters;
  const showEmpty = !loading && !error && total === 0 && !hasFilters;

  return (
    <div>
      {/* Search + filters */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex-1">
          <label htmlFor="course-search" className="mb-1.5 block text-sm font-semibold text-ink-700">
            Search courses
          </label>
          <div className="relative">
            <Search
              fontSize="small"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="course-search"
              type="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by title or description"
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-10 text-[15px] text-ink-900 placeholder:text-slate-400 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
            />
            {term && (
              <button
                type="button"
                onClick={() => setTerm("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
              >
                <Close fontSize="small" />
              </button>
            )}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="lg:w-56">
            <label htmlFor="course-category" className="mb-1.5 block text-sm font-semibold text-ink-700">
              Category
            </label>
            <select
              id="course-category"
              value={category}
              onChange={(e) => replaceParams({ category: e.target.value || undefined, page: undefined })}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-[15px] text-ink-900 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="lg:w-56">
          <label htmlFor="course-sort" className="mb-1.5 block text-sm font-semibold text-ink-700">
            Sort by
          </label>
          <select
            id="course-sort"
            value={sort}
            onChange={(e) => replaceParams({ sort: e.target.value === "newest" ? undefined : e.target.value, page: undefined })}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-[15px] text-ink-900 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result count / live region */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p aria-live="polite" className="text-sm text-ink-600">
          {loading ? "Loading courses…" : `${total} ${total === 1 ? "course" : "courses"} found`}
        </p>
        {hasFilters && (
          <button
            type="button"
            onClick={() => router.replace("/courses", { scroll: false })}
            className="text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Reset filters
          </button>
        )}
      </div>

      {/* Results */}
      <div className="mt-6">
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/5 p-8 text-center">
            <h2 className="font-display text-lg font-bold text-ink-900">Something went wrong</h2>
            <p className="mx-auto mt-2 max-w-md text-ink-600">{error}</p>
            <button
              type="button"
              onClick={() => setNonce((n) => n + 1)}
              className="mt-5 inline-flex items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
            >
              Try again
            </button>
          </div>
        ) : showNoResults ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <h2 className="font-display text-lg font-bold text-ink-900">No courses match your search</h2>
            <p className="mx-auto mt-2 max-w-md text-ink-600">
              Try different keywords or remove the filters you have applied.
            </p>
            <button
              type="button"
              onClick={() => router.replace("/courses", { scroll: false })}
              className="mt-5 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-[15px] font-semibold text-ink-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
            >
              Reset filters
            </button>
          </div>
        ) : showEmpty ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
            <h2 className="font-display text-lg font-bold text-ink-900">Courses are being published</h2>
            <p className="mx-auto mt-2 max-w-md text-ink-600">
              Our catalogue is being prepared. Check back soon, or get in touch to hear about upcoming programs.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-10 flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => replaceParams({ page: String(page - 1) })}
            className={cn(
              "inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-slate-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 disabled:opacity-40 disabled:pointer-events-none",
            )}
          >
            <ChevronLeft fontSize="small" />
            Previous
          </button>
          <span className="text-sm text-ink-600">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={!hasMore}
            onClick={() => replaceParams({ page: String(page + 1) })}
            className={cn(
              "inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-slate-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 disabled:opacity-40 disabled:pointer-events-none",
            )}
          >
            Next
            <ChevronRight fontSize="small" />
          </button>
        </nav>
      )}
    </div>
  );
}
