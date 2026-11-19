"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import Search from "@mui/icons-material/Search";
import Close from "@mui/icons-material/Close";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Terminal from "@mui/icons-material/Terminal";
import Palette from "@mui/icons-material/Palette";
import Explore from "@mui/icons-material/Explore";
import { api, ApiError } from "@/lib/api";
import type { CourseListItem } from "@/lib/types";
import CourseCardLive from "@/components/landing/CourseCardLive";
import Select from "@/components/ui/Select";
import { cn } from "@/lib/cn";

const LIMIT = 12;
const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
] as const;

const TRACK_TABS = [
  { value: "", label: "All tracks", Icon: Explore },
  { value: "EDUCATION", label: "Education", Icon: Terminal },
  { value: "ALTERNATIVE_EDUCATION", label: "Alternate arts", Icon: Palette },
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
        <div key={i} className="overflow-hidden rounded-2xl border border-rule bg-[#ffffff] shadow-elev1">
          <div className="aspect-[16/10] w-full animate-pulse bg-paper-2 motion-reduce:animate-none" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-1/3 animate-pulse rounded bg-paper-2 motion-reduce:animate-none" />
            <div className="h-5 w-2/3 animate-pulse rounded bg-paper-2 motion-reduce:animate-none" />
            <div className="h-4 w-full animate-pulse rounded bg-paper-2 motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CourseBrowser({ basePath = "/courses" }: { basePath?: string } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reduceMotion = useReducedMotion();

  const q = searchParams.get("q")?.trim() ?? "";
  const category = searchParams.get("category") ?? "";
  const type =
    searchParams.get("type") === "ALTERNATIVE_EDUCATION"
      ? "ALTERNATIVE_EDUCATION"
      : searchParams.get("type") === "EDUCATION"
        ? "EDUCATION"
        : "";
  const rawSort = searchParams.get("sort") ?? "";
  const sort = (SORTS.some((s) => s.value === rawSort) ? rawSort : "newest") as string;
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const hasFilters = Boolean(q || category || type || sort !== "newest" || page > 1);

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
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    },
    [router, searchParams, basePath],
  );

  useEffect(() => {
    setTerm(q);
  }, [q]);

  useEffect(() => {
    if (term === q) return;
    const h = setTimeout(() => replaceParams({ q: term.trim() || undefined, page: undefined }), 350);
    return () => clearTimeout(h);
  }, [term, q, replaceParams]);

  useEffect(() => {
    api<{ categories: string[] }>("/courses/categories", { method: "GET", auth: false })
      .then((d) => setCategories(d.categories))
      .catch(() => setCategories([]));
  }, [nonce]);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    api<ListResponse>("/courses", {
      method: "GET",
      auth: false,
      signal: ctrl.signal,
      query: { q: q || undefined, category: category || undefined, type: type || undefined, sort, page, limit: LIMIT },
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
  }, [q, category, type, sort, page, nonce]);

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const showNoResults = !loading && !error && total === 0 && hasFilters;
  const showEmpty = !loading && !error && total === 0 && !hasFilters;

  return (
    <div>
      {/* Interactive Command & Filter Dock */}
      <div className="rounded-2xl border border-rule bg-[#ffffff] p-4 shadow-elev2 sm:p-5">
        <div className="flex flex-col gap-3.5 lg:flex-row lg:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <label htmlFor="course-search" className="sr-only">
              Search courses
            </label>
            <Search
              fontSize="small"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="course-search"
              type="text"
              role="searchbox"
              inputMode="search"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search by course, skill, or topic (e.g. AI, Figma, Python)…"
              className="h-11 w-full rounded-xl border border-rule bg-paper pl-10 pr-10 text-sm text-ink placeholder:text-muted focus-visible:border-brand-600 focus-visible:bg-[#ffffff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/20"
            />
            {term && (
              <button
                type="button"
                onClick={() => setTerm("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-paper-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
              >
                <Close fontSize="small" />
              </button>
            )}
          </div>

          {/* Interactive Track Segmented Switch */}
          <div
            role="tablist"
            aria-label="Filter by learning track"
            className="inline-flex items-center gap-1 rounded-xl border border-rule bg-paper-2 p-1"
          >
            {TRACK_TABS.map(({ value, label, Icon }) => {
              const active = type === value;
              return (
                <button
                  key={label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => replaceParams({ type: value || undefined, page: undefined })}
                  className={cn(
                    "relative inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                    active ? "text-white" : "text-ink-2 hover:text-ink",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="course-track-pill"
                      transition={
                        reduceMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 400, damping: 32 }
                      }
                      className="absolute inset-0 rounded-lg bg-brand-600 shadow-sm"
                    />
                  )}
                  <Icon sx={{ fontSize: 15 }} className="relative z-10 shrink-0" aria-hidden />
                  <span className="relative z-10 whitespace-nowrap">{label}</span>
                </button>
              );
            })}
          </div>

          {/* Sort Select */}
          <div className="lg:w-44">
            <label htmlFor="course-sort" className="sr-only">
              Sort courses
            </label>
            <Select
              id="course-sort"
              value={sort}
              onChange={(e) =>
                replaceParams({
                  sort: e.target.value === "newest" ? undefined : e.target.value,
                  page: undefined,
                })
              }
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* One-Click Interactive Category Chips */}
        {categories.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-rule/80 pt-3.5">
            <span className="mr-1 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-muted">
              Topics:
            </span>
            <button
              type="button"
              onClick={() => replaceParams({ category: undefined, page: undefined })}
              className={cn(
                "cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                category === ""
                  ? "border-brand-600 bg-brand-600 text-white shadow-xs"
                  : "border-rule bg-paper text-ink-2 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800",
              )}
            >
              All categories
            </button>
            {categories.map((c) => {
              const active = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => replaceParams({ category: active ? undefined : c, page: undefined })}
                  className={cn(
                    "cursor-pointer rounded-full border px-3 py-1 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600",
                    active
                      ? "border-brand-600 bg-brand-600 font-semibold text-white shadow-xs"
                      : "border-rule bg-paper text-ink-2 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800",
                  )}
                >
                  {c}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Live Result Summary + Active Filter Chips */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            aria-live="polite"
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
              error
                ? "border-danger/30 bg-danger/10 text-danger"
                : "border-brand-200 bg-brand-50 text-brand-900",
            )}
          >
            <span
              className={cn("h-1.5 w-1.5 rounded-full", error ? "bg-danger" : "bg-brand-600")}
              aria-hidden="true"
            />
            {loading
              ? "Loading courses…"
              : error
                ? "Unable to load courses"
                : `${total} ${total === 1 ? "course" : "courses"} found`}
          </span>

          {q && (
            <button
              type="button"
              onClick={() => replaceParams({ q: undefined, page: undefined })}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-rule bg-[#ffffff] px-2.5 py-1 text-xs font-medium text-ink-2 hover:border-brand-300 hover:text-ink"
            >
              <span>&ldquo;{q}&rdquo;</span>
              <Close sx={{ fontSize: 13 }} aria-hidden />
            </button>
          )}
          {category && (
            <button
              type="button"
              onClick={() => replaceParams({ category: undefined, page: undefined })}
              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-rule bg-[#ffffff] px-2.5 py-1 text-xs font-medium text-ink-2 hover:border-brand-300 hover:text-ink"
            >
              <span>{category}</span>
              <Close sx={{ fontSize: 13 }} aria-hidden />
            </button>
          )}
        </div>

        {hasFilters && (
          <button
            type="button"
            onClick={() => router.replace(basePath, { scroll: false })}
            className="cursor-pointer text-xs font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 transition-colors hover:text-brand-800"
          >
            Reset all filters
          </button>
        )}
      </div>

      {/* Results Grid */}
      <div className="mt-6">
        {loading ? (
          <SkeletonGrid />
        ) : error ? (
          <div role="alert" className="rounded-2xl border border-danger/30 bg-danger/5 p-8 text-center">
            <h2 className="font-display text-lg font-semibold text-ink">Something went wrong</h2>
            <p className="mx-auto mt-2 max-w-md text-ink-2">{error}</p>
            <button
              type="button"
              onClick={() => setNonce((n) => n + 1)}
              className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-xl bg-brand-600 px-5 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
            >
              Try again
            </button>
          </div>
        ) : showNoResults ? (
          <div className="rounded-2xl border border-dashed border-rule bg-paper-2 p-10 text-center">
            <h2 className="mx-auto font-display text-lg font-semibold text-ink">No courses match your search</h2>
            <p className="mx-auto mt-2 max-w-md text-ink-2">
              Try different keywords or clear a topic chip above to explore all courses.
            </p>
            <button
              type="button"
              onClick={() => router.replace(basePath, { scroll: false })}
              className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-xl border border-rule bg-[#ffffff] px-5 py-2.5 text-sm font-semibold text-ink shadow-elev1 transition hover:border-brand-300 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
            >
              Reset filters
            </button>
          </div>
        ) : showEmpty ? (
          <div className="rounded-2xl border border-dashed border-rule bg-paper-2 p-10 text-center">
            <h2 className="mx-auto font-display text-lg font-semibold text-ink">Courses are being published</h2>
            <p className="mx-auto mt-2 max-w-md text-ink-2">
              Our catalogue is being prepared. Check back soon, or get in touch to hear about upcoming programs.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c, index) => (
              <motion.div
                key={c.id}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.28,
                  delay: reduceMotion ? 0 : Math.min(index * 0.03, 0.24),
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex"
              >
                <CourseCardLive course={c} className="w-full" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Numbered Pagination */}
      {!loading && !error && totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-10 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => replaceParams({ page: String(page - 1) })}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1 rounded-xl border border-rule bg-[#ffffff] px-4 py-2 text-sm font-semibold text-ink shadow-elev1 transition hover:border-brand-300 hover:bg-brand-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 disabled:pointer-events-none disabled:opacity-40",
            )}
          >
            <ChevronLeft fontSize="small" />
            Previous
          </button>

          <div className="flex items-center gap-1.5 px-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const current = p === page;
              return (
                <button
                  key={p}
                  type="button"
                  aria-current={current ? "page" : undefined}
                  onClick={() => replaceParams({ page: p === 1 ? undefined : String(p) })}
                  className={cn(
                    "inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40",
                    current
                      ? "border-brand-600 bg-brand-600 text-white shadow-sm"
                      : "border-rule bg-[#ffffff] text-ink-2 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800",
                  )}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            disabled={!hasMore}
            onClick={() => replaceParams({ page: String(page + 1) })}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1 rounded-xl border border-rule bg-[#ffffff] px-4 py-2 text-sm font-semibold text-ink shadow-elev1 transition hover:border-brand-300 hover:bg-brand-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 disabled:pointer-events-none disabled:opacity-40",
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
