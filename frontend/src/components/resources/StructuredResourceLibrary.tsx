"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Search from "@mui/icons-material/Search";
import Close from "@mui/icons-material/Close";
import AccessTime from "@mui/icons-material/AccessTime";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Psychology from "@mui/icons-material/Psychology";
import SportsEsports from "@mui/icons-material/SportsEsports";
import MusicNote from "@mui/icons-material/MusicNote";
import Palette from "@mui/icons-material/Palette";
import LibraryBooks from "@mui/icons-material/LibraryBooks";
import type {
  ResourceLearningPathArticle,
  ResourceLearningPathCategory,
} from "@/lib/types";
import { cn } from "@/lib/cn";

function countLessons(category: ResourceLearningPathCategory): number {
  return (
    category.articles.length +
    category.subcategories.reduce((total, subcategory) => total + subcategory.articles.length, 0)
  );
}

function countMinutes(category: ResourceLearningPathCategory): number {
  const top = category.articles.reduce((s, a) => s + (a.estimatedMinutes || 0), 0);
  const sub = category.subcategories.reduce(
    (s, sc) => s + sc.articles.reduce((m, a) => m + (a.estimatedMinutes || 0), 0),
    0,
  );
  return top + sub;
}

function topicIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes("game")) return SportsEsports;
  if (lower.includes("music")) return MusicNote;
  if (lower.includes("video") || lower.includes("design") || lower.includes("art")) return Palette;
  if (lower.includes("ai")) return Psychology;
  return LibraryBooks;
}

function matchesSearch(article: ResourceLearningPathArticle, query: string): boolean {
  if (!query) return true;
  const searchText = `${article.title} ${article.description} ${article.tags.join(" ")}`.toLowerCase();
  return searchText.includes(query);
}

export default function StructuredResourceLibrary({
  categories,
}: {
  categories: ResourceLearningPathCategory[];
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(categories[0]?.id ?? "");
  const [term, setTerm] = useState("");
  const reduceMotion = useReducedMotion();
  const query = term.trim().toLowerCase();

  // Sync URL ?q= and #hash (e.g. /resources#music-making or /resources?q=patterns)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialQ = params.get("q")?.trim();
    if (initialQ) setTerm(initialQ);

    const syncFromHash = () => {
      const hash = window.location.hash.replace(/^#/, "").trim().toLowerCase();
      if (!hash) return;
      const match = categories.find(
        (c) => c.slug.toLowerCase() === hash || c.id.toLowerCase() === hash,
      );
      if (match) setSelectedCategoryId(match.id);
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [categories]);

  const filteredCategories = useMemo(
    () =>
      categories
        .map((category) => ({
          ...category,
          articles: category.articles.filter((article) => matchesSearch(article, query)),
          subcategories: category.subcategories
            .map((subcategory) => ({
              ...subcategory,
              articles: subcategory.articles.filter((article) => matchesSearch(article, query)),
            }))
            .filter((subcategory) => subcategory.articles.length > 0),
        }))
        .filter(
          (category) =>
            category.articles.length > 0 || category.subcategories.length > 0 || !query,
        ),
    [categories, query],
  );

  const selectedCategory =
    filteredCategories.find((category) => category.id === selectedCategoryId) ??
    filteredCategories[0];

  const chapters = selectedCategory
    ? [
        ...selectedCategory.subcategories,
        ...(selectedCategory.articles.length > 0
          ? [
              {
                id: `${selectedCategory.id}-other`,
                name:
                  selectedCategory.subcategories.length > 0
                    ? "More tutorials"
                    : selectedCategory.name,
                description: null,
                articles: selectedCategory.articles,
              },
            ]
          : []),
      ]
    : [];

  const totalLessons = selectedCategory ? countLessons(selectedCategory) : 0;
  const totalMinutes = selectedCategory ? countMinutes(selectedCategory) : 0;
  const firstArticle = chapters[0]?.articles[0] ?? null;
  const ActiveIcon = selectedCategory ? topicIcon(selectedCategory.name) : LibraryBooks;

  return (
    <div className="space-y-8">
      {/* Floating Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-rule bg-[#ffffff] p-4 shadow-elev1 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <label htmlFor="structured-resource-search" className="sr-only">
            Search tutorials
          </label>
          <Search
            sx={{ fontSize: 20 }}
            aria-hidden
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            id="structured-resource-search"
            type="text"
            role="searchbox"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="Search tutorials across AI, Game Dev, Music Making, Video Editing…"
            className="h-11 w-full rounded-xl border border-rule bg-paper pl-11 pr-10 text-sm text-ink placeholder:text-muted focus-visible:border-brand-600 focus-visible:bg-[#ffffff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/20"
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-paper-2 hover:text-ink"
            >
              <Close fontSize="small" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-ink-2 sm:pl-2">
          <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-brand-900">
            {filteredCategories.length} {filteredCategories.length === 1 ? "topic" : "topics"}
          </span>
        </div>
      </div>

      {filteredCategories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-rule bg-paper-2 py-14 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">No tutorials found</h2>
          <p className="mt-2 text-sm text-ink-2">Try another keyword or clear your search filter.</p>
          <button
            type="button"
            onClick={() => setTerm("")}
            className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-xl border border-rule bg-[#ffffff] px-4 py-2 text-sm font-semibold text-ink shadow-elev1 transition hover:border-brand-300 hover:bg-brand-50"
          >
            Reset search
          </button>
        </div>
      ) : (
        <>
          {/* Interactive Topic Track Deck */}
          <nav aria-label="Tutorial topics">
            <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
              {filteredCategories.map((category) => {
                const active = selectedCategory?.id === category.id;
                const lessonCount = countLessons(category);
                const mins = countMinutes(category);
                const Icon = topicIcon(category.name);

                return (
                  <li key={category.id} id={category.slug}>
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(category.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "group relative flex h-full w-full cursor-pointer flex-col justify-between rounded-2xl border p-5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
                        active
                          ? "border-[#025926] bg-[#ffffff] shadow-elev2 ring-2 ring-[#025926]/15"
                          : "border-rule bg-[#ffffff]/80 shadow-elev1 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-[#ffffff] hover:shadow-elev2",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span
                          className={cn(
                            "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-colors",
                            active
                              ? "border-[#025926] bg-[#025926] text-white"
                              : "border-brand-200 bg-brand-50 text-brand-700 group-hover:border-brand-300",
                          )}
                        >
                          <Icon fontSize="small" aria-hidden />
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold",
                            active
                              ? "border-brand-200 bg-brand-50 text-brand-800"
                              : "border-rule bg-paper-2 text-muted",
                          )}
                        >
                          {lessonCount} lessons
                        </span>
                      </div>

                      <div className="mt-4">
                        <h2
                          className={cn(
                            "font-display text-base font-semibold leading-snug transition-colors",
                            active ? "text-[#025926]" : "text-ink group-hover:text-brand-800",
                          )}
                        >
                          {category.name}
                        </h2>
                        <p className="mt-1.5 flex items-center gap-1 text-xs text-muted">
                          <AccessTime sx={{ fontSize: 13 }} aria-hidden />
                          <span>~{mins} min path</span>
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Active Topic Learning Trail */}
          {selectedCategory && (
            <AnimatePresence mode="wait" initial={false}>
              <motion.main
                key={selectedCategory.id}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-10"
              >
                {/* Solid Brand-Green Active Path Banner */}
                <header className="overflow-hidden rounded-3xl bg-[#025926] p-6 text-white shadow-elev2 sm:p-8">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="max-w-2xl">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-semibold text-white">
                        <ActiveIcon sx={{ fontSize: 15 }} aria-hidden />
                        <span>
                          {chapters.length} {chapters.length === 1 ? "Chapter" : "Chapters"} · {totalLessons} Tutorials · ~{totalMinutes} min
                        </span>
                      </div>

                      <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                        {selectedCategory.name}
                      </h2>

                      {selectedCategory.description && (
                        <p className="mt-2.5 text-sm leading-relaxed text-white/90 sm:text-base">
                          {selectedCategory.description}
                        </p>
                      )}
                    </div>

                    {firstArticle && (
                      <div className="shrink-0">
                        <Link
                          href={`/resources/${firstArticle.slug}`}
                          className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#ffffff] px-5 text-sm font-semibold text-[#025926] shadow-sm transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                          Start Lesson 1.01
                          <ArrowForward sx={{ fontSize: 16 }} aria-hidden />
                        </Link>
                      </div>
                    )}
                  </div>
                </header>

                {/* Staged Chapter Roadmap with Tutorial Cards */}
                <div className="space-y-10">
                  {chapters.map((chapter, chapterIndex) => (
                    <section
                      key={chapter.id}
                      aria-labelledby={`chapter-${chapter.id}`}
                      className="relative"
                    >
                      <div className="flex items-start gap-4">
                        <span
                          aria-hidden="true"
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#025926] font-mono text-xs font-bold text-white shadow-elev1"
                        >
                          {String(chapterIndex + 1).padStart(2, "0")}
                        </span>
                        <div className="min-w-0">
                          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                            Chapter {chapterIndex + 1}
                          </p>
                          <h3
                            id={`chapter-${chapter.id}`}
                            className="mt-0.5 font-display text-xl font-semibold text-ink sm:text-2xl"
                          >
                            {chapter.name}
                          </h3>
                          {chapter.description && (
                            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-2">
                              {chapter.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {chapter.articles.map((article, index) => {
                          const lessonNumber = `${chapterIndex + 1}.${String(index + 1).padStart(2, "0")}`;
                          return (
                            <li key={article.id} className="flex">
                              <Link
                                href={`/resources/${article.slug}`}
                                className="group flex w-full flex-col rounded-2xl border border-rule bg-[#ffffff] p-5 shadow-elev1 transition-all duration-200 hover:-translate-y-1 hover:border-brand-400 hover:shadow-elev2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="rounded-lg border border-brand-200 bg-brand-50 px-2.5 py-0.5 font-mono text-xs font-bold tabular-nums text-brand-800">
                                    {lessonNumber}
                                  </span>
                                  <span className="inline-flex items-center gap-1 rounded-full border border-rule bg-paper-2 px-2.5 py-0.5 text-[11px] font-medium text-muted">
                                    <AccessTime sx={{ fontSize: 12 }} aria-hidden />
                                    {article.estimatedMinutes} min
                                  </span>
                                </div>

                                <h4 className="mt-4 font-display text-base font-semibold leading-snug text-ink transition-colors group-hover:text-[#025926]">
                                  {article.title}
                                </h4>

                                {article.description && (
                                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-2">
                                    {article.description}
                                  </p>
                                )}

                                <div className="mt-5 flex items-center justify-between border-t border-rule/70 pt-3.5 text-xs font-semibold text-brand-700 group-hover:text-[#025926]">
                                  <span>Read tutorial</span>
                                  <ArrowForward
                                    sx={{ fontSize: 15 }}
                                    aria-hidden
                                    className="transition-transform duration-200 group-hover:translate-x-1"
                                  />
                                </div>
                              </Link>
                            </li>
                          );
                        })}
                      </ol>
                    </section>
                  ))}
                </div>
              </motion.main>
            </AnimatePresence>
          )}
        </>
      )}
    </div>
  );
}
