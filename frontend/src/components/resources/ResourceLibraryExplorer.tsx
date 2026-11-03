"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Search from "@mui/icons-material/Search";
import Close from "@mui/icons-material/Close";
import AccessTime from "@mui/icons-material/AccessTime";
import Visibility from "@mui/icons-material/Visibility";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { api } from "@/lib/api";
import type { ResourceArticleCard, ResourceCategoryItem } from "@/lib/types";
import { cn } from "@/lib/cn";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import Select from "@/components/ui/Select";

const PAGE_SIZE = 12;

interface LibraryResponse {
  articles: ResourceArticleCard[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
  featured?: ResourceArticleCard[];
}

interface Props {
  initialCategories: ResourceCategoryItem[];
  initialArticles: ResourceArticleCard[];
  initialFeatured: ResourceArticleCard[];
}

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "views", label: "Most read" },
] as const;

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"] as const;

function ArticleCard({ article }: { article: ResourceArticleCard }) {
  return (
    <Link
      href={`/resources/${article.slug}`}
      className={cn(
        "group grid min-w-0 gap-3 border-b border-slate-200 py-5 transition-colors hover:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6",
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <AccessTime sx={{ fontSize: 14 }} />
            {article.estimatedMinutes} min read
          </span>
        </div>

        <h3 className="mt-3 min-w-0 break-words line-clamp-2 font-display text-lg font-semibold leading-snug text-ink-900 group-hover:text-brand-800">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-base leading-relaxed text-slate-600">
          {article.description}
        </p>
      </div>
      <div className="flex items-center justify-between gap-5 sm:justify-end">
        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
          <Visibility sx={{ fontSize: 15 }} />
          {article.views.toLocaleString()} reads
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
          Read
          <ArrowForward sx={{ fontSize: 15 }} className="transition group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="border-b border-slate-200 py-5" aria-hidden>
      <div className="space-y-3">
        <div className="h-3 w-1/4 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
        <div className="h-3 w-full animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
        <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100 motion-reduce:animate-none" />
      </div>
    </div>
  );
}

export default function ResourceLibraryExplorer({ initialCategories, initialArticles, initialFeatured }: Props) {
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [sort, setSort] = useState<string>("newest");
  const [page, setPage] = useState(1);

  const [articles, setArticles] = useState<ResourceArticleCard[]>(initialArticles);
  const [featured, setFeatured] = useState<ResourceArticleCard[]>(initialFeatured);
  const [total, setTotal] = useState(initialArticles.length);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);
  const firstRun = useRef(true);

  const filtersActive = Boolean(query || category || difficulty || sort !== "newest");

  useEffect(() => {
    const h = setTimeout(() => {
      setQuery(term.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(h);
  }, [term]);

  const load = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const data = await api<LibraryResponse>("/resources/library", {
          method: "GET",
          auth: false,
          signal,
          query: {
            q: query || undefined,
            category: category || undefined,
            difficulty: difficulty || undefined,
            sort,
            page,
            limit: PAGE_SIZE,
          },
        });
        if (signal.aborted) return;
        setArticles((prev) => (page === 1 ? data.articles : [...prev, ...data.articles]));
        setTotal(data.total);
        setHasMore(data.hasMore);
        if (page === 1) setFeatured(data.featured ?? []);
      } catch (err) {
        if (signal.aborted) return;
        setError(err instanceof Error ? err.message : "Could not load resources. Please try again.");
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    },
    [query, category, difficulty, sort, page],
  );

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const ctrl = new AbortController();
    void load(ctrl.signal);
    return () => ctrl.abort();
  }, [load, nonce]);

  const categories = useMemo(() => initialCategories.filter((c) => (c.articleCount ?? 0) > 0), [initialCategories]);
  const activeCategory = categories.find((c) => c.slug === category);
  const showFeatured = !filtersActive && featured.length > 0;
  const featuredIds = useMemo(() => new Set(featured.slice(0, 3).map((article) => article.id)), [featured]);
  const visibleArticles = showFeatured ? articles.filter((article) => !featuredIds.has(article.id)) : articles;
  const visibleTotal = showFeatured ? Math.max(0, total - featuredIds.size) : total;
  const showEmpty = !loading && !error && articles.length === 0 && filtersActive;
  const showLibraryEmpty = !loading && !error && articles.length === 0 && !filtersActive && !showFeatured;

  const resetFilters = () => {
    setTerm("");
    setQuery("");
    setCategory("");
    setDifficulty("");
    setSort("newest");
    setPage(1);
  };

  return (
    <div className="space-y-12">
      {showFeatured && (
        <section aria-labelledby="featured-resources">
          <h2 id="featured-resources" className="font-display text-2xl font-semibold text-ink-900">
            Featured guides
          </h2>
          <div className="mt-3">
            {featured.slice(0, 3).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="library-heading" className="scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="library-heading" className="font-display text-2xl font-semibold text-ink-900">
              {activeCategory ? activeCategory.name : showFeatured ? "More guides" : "Browse all guides"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {loading && page === 1
                ? "Loading resources…"
                : `${visibleTotal} ${visibleTotal === 1 ? "guide" : "guides"}`}
            </p>
          </div>
          {filtersActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30 active:scale-[0.98]"
            >
              <Close sx={{ fontSize: 14 }} />
              Clear filters
            </button>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-3 sm:p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search
                sx={{ fontSize: 20 }}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <label htmlFor="resource-search" className="sr-only">
                Search resources
              </label>
              <input
                id="resource-search"
                type="search"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search guides, topics, tags…"
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 active:border-brand-500"
              />
              {term && (
                <button
                  type="button"
                  onClick={() => setTerm("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30 active:bg-slate-200"
                >
                  <Close sx={{ fontSize: 16 }} />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
              <div className="min-w-0">
                <label htmlFor="resource-difficulty" className="sr-only">
                  Difficulty
                </label>
                <Select
                  id="resource-difficulty"
                  value={difficulty}
                  onChange={(e) => {
                    setDifficulty(e.target.value);
                    setPage(1);
                  }}
                  className="h-11 active:border-brand-500"
                >
                  <option value="">All levels</option>
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="min-w-0">
                <label htmlFor="resource-sort" className="sr-only">
                  Sort by
                </label>
                <Select
                  id="resource-sort"
                  value={sort}
                  onChange={(e) => {
                    setSort(e.target.value);
                    setPage(1);
                  }}
                  className="h-11 active:border-brand-500"
                >
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setPage(1);
              }}
              aria-pressed={category === ""}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30 active:scale-[0.97]",
                category === ""
                  ? "border-brand-700 bg-brand-700 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-brand-400",
              )}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCategory(c.slug);
                  setPage(1);
                }}
                aria-pressed={category === c.slug}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30 active:scale-[0.97]",
                  category === c.slug
                    ? "border-brand-700 bg-brand-700 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:border-brand-400",
                )}
              >
                {c.name}
                {typeof c.articleCount === "number" && <span className="ml-1.5 opacity-70">{c.articleCount}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {error ? (
            <ErrorState
              title="Could not load resources"
              message={error}
              onRetry={() => setNonce((n) => n + 1)}
            />
          ) : loading && page === 1 ? (
            <div className="divide-y divide-slate-200">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : showEmpty ? (
            <EmptyState
              title="No resources match those filters"
              description="Try a different search term or clear the filters to browse the full library."
            />
          ) : showLibraryEmpty ? (
            <EmptyState
              title="The library is being prepared"
              description="Free guides and tutorials will appear here as soon as they are published."
            />
          ) : (
            <>
              <div className="divide-y divide-slate-200">
                {visibleArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {loading && page > 1 && (
                <div className="mt-6 divide-y divide-slate-200">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              )}

              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loading}
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-ink-800 transition hover:border-brand-500 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30 active:scale-[0.98]"
                  >
                    {loading ? "Loading…" : "Load more resources"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
