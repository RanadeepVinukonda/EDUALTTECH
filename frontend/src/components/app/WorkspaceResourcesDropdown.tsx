"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ExpandMore from "@mui/icons-material/ExpandMore";
import Search from "@mui/icons-material/Search";
import { api } from "@/lib/api";
import type {
  ResourceLearningPathArticle,
  ResourceLearningPathCategory,
} from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  pathname: string;
  onNavigate: () => void;
  mobile?: boolean;
}

interface LearningPathLesson {
  article: ResourceLearningPathArticle;
  category: string;
  chapter: string;
}

export default function WorkspaceResourcesDropdown({
  pathname,
  onNavigate,
  mobile = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<ResourceLearningPathCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = pathname === "/resources" || pathname.startsWith("/resources/");
  const searchId = mobile ? "workspace-resource-search-mobile" : "workspace-resource-search";
  const categoryId = mobile ? "workspace-resource-category-mobile" : "workspace-resource-category";

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(term.trim().toLowerCase()), 250);
    return () => window.clearTimeout(timer);
  }, [term]);

  useEffect(() => {
    if (!open || categories.length > 0) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    api<{ categories: ResourceLearningPathCategory[] }>("/resources/learning-path", {
      auth: false,
      signal: controller.signal,
    })
      .then((data) => setCategories(data.categories))
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Could not load learning paths.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [open, categories.length]);

  const lessons = useMemo(
    () =>
      categories.flatMap((item) => [
        ...item.subcategories.flatMap((chapter) =>
          chapter.articles.map((article) => ({
            article,
            category: item.name,
            chapter: chapter.name,
          })),
        ),
        ...item.articles.map((article) => ({
          article,
          category: item.name,
          chapter: item.name,
        })),
      ]),
    [categories],
  );
  const visibleLessons = lessons
    .filter((lesson) => !category || lesson.category === category)
    .filter((lesson) => {
      if (!query) return true;
      const text = `${lesson.category} ${lesson.chapter} ${lesson.article.title} ${lesson.article.description} ${lesson.article.tags.join(" ")}`;
      return text.toLowerCase().includes(query);
    })
    .slice(0, 6);

  return (
    <details
      className={cn("group", !mobile && "relative")}
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary
        className={cn(
          "flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus [&::-webkit-details-marker]:hidden",
          active ? "bg-paper-2 font-semibold text-accent" : "text-ink-2 hover:bg-paper-2 hover:text-ink",
          mobile && "w-full",
        )}
      >
        Resources
        <ExpandMore
          fontSize="small"
          aria-hidden
          className="text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none"
        />
      </summary>
      <div
        className={cn(
          "z-50 rounded-lg border border-rule bg-paper p-3 shadow-elev2",
          mobile
            ? "ml-3 mt-1 border-y-0 border-r-0 border-l-2 border-l-rule shadow-none"
            : "absolute left-0 top-[calc(100%+0.5rem)] w-[min(24rem,calc(100vw-2rem))]",
        )}
      >
        <label htmlFor={searchId} className="sr-only">
          Search tutorials
        </label>
        <div className="relative">
          <Search
            fontSize="small"
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id={searchId}
            type="search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search tutorials"
            className="h-10 w-full rounded-md border border-rule bg-paper pl-9 pr-3 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-55"
          />
        </div>

        <label className="sr-only" htmlFor={categoryId}>
          Filter tutorials by learning path
        </label>
        <select
          id={categoryId}
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="mt-2 h-10 w-full rounded-md border border-rule bg-paper px-2 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-55"
        >
          <option value="">All learning paths</option>
          {categories.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>

        <div className="mt-2 max-h-64 overflow-y-auto" aria-live="polite">
          {loading ? (
            <p className="px-2 py-3 text-sm text-muted">Loading learning paths…</p>
          ) : error ? (
            <p className="px-2 py-3 text-sm text-danger">{error}</p>
          ) : visibleLessons.length > 0 ? (
            <ul>
              {visibleLessons.map(({ article, category: pathName, chapter }) => (
                <li key={article.id}>
                  <Link
                    href={`/resources/${article.slug}`}
                    onClick={onNavigate}
                    className="block rounded-md px-2 py-2.5 hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <span className="block text-sm font-medium text-ink">{article.title}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {pathName} / {chapter}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-2 py-3 text-sm text-muted">
              {query || category ? "No tutorials match those filters." : "No learning paths available yet."}
            </p>
          )}
        </div>

        <Link
          href="/resources"
          onClick={onNavigate}
          className="mt-2 block border-t border-rule px-2 pt-3 text-sm font-semibold text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Browse all learning paths
        </Link>
      </div>
    </details>
  );
}
