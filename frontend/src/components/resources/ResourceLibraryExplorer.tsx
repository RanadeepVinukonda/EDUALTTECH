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
import CoverImage from "@/components/ui/CoverImage";

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

const difficultyTone: Record<string, string> = {
  Beginner: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Intermediate: "bg-sky-50 text-sky-700 border-sky-200",
  Advanced: "bg-violet-50 text-violet-700 border-violet-200",
};

function articleMeta(article: ResourceArticleCard) {
  return article.category?.name ?? "Resource";
}

function ArticleCard({ article }: { article: ResourceArticleCard }) {
  return (
    <Link
      href={`/resources/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-brand-300 hover:shadow-[0_8px_30px_rgba(2,35,18,0.06)] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-600/30"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-brand-50">
        <CoverImage
          src={article.coverUrl}
          alt={article.title}
          fallback={articleMeta(article)}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <span className="absolute left-3 top-3 rounded-full border border-brand-200 bg-white/95 px-2.5 py-0.5 text-xs font-medium text-brand-800 backdrop-blur">
          {articleMeta(article)}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px] font-medium",
              difficultyTone[article.difficulty] ?? difficultyTone.Beginner,
            )}
          >
            {article.difficulty}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
            <AccessTime sx={{ fontSize: 14 }} />
            {article.estimatedMinutes} min read
          </span>
        </div>

        <h3 className="mt-3 line-clamp-2 font-display text-lg font-semibold leading-snug text-ink-900 group-hover:text-brand-800">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-slate-600">{article.description}</p>

        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <Visibility sx={{ fontSize: 15 }} />
            {article.views.toLocaleString()} reads
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
            Read
            <ArrowForward sx={{ fontSize: 15 }} className="transition group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200" aria-hidden>
      <div className="aspect-[16/9] w-full animate-pulse bg-slate-100 motion-reduce:animate-none" />
      <div className="space-y-3 p-5">
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
  const showFeatured = page === 1 && !filtersActive && featured.length > 0;
  const showEmpty = !loading && !error && articles.length === 0 && filtersActive;
  const showLibraryEmpty = !loading && !error && articles.length === 0 && !filtersActive;

  const resetFilters = () => {
    setTerm("");
    setQuery("");
    setCategory("");
    setDifficulty("");
    setSort("newest");
    setPage(1);
  };

  return (
    <div className="space-y-10">
      {showFeatured && (
        <section aria-labelledby="featured-resources">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h2 id="featured-resources" className="font-display text-2xl font-semibold text-ink-900">
                Featured guides
              </h2>
              <p className="mt-1 text-sm text-slate-600">Hand-picked reads to start with.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
              {activeCategory ? activeCategory.name : "All resources"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {loading && page === 1
                ? "Loading resources…"
                : `${total} free ${total === 1 ? "resource" : "resources"}${activeCategory ? ` in ${activeCategory.name}` : ""}`}
            </p>
          </div>
          {filtersActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
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
                className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
              />
              {term && (
                <button
                  type="button"
                  onClick={() => setTerm("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
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
                  className="h-11"
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
                  className="h-11"
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
                "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30",
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
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30",
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {loading && page > 1 && (
                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                    className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-6 text-sm font-semibold text-ink-800 transition hover:border-brand-500 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30"
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
