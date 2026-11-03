"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Search from "@mui/icons-material/Search";
import AccessTime from "@mui/icons-material/AccessTime";
import ChevronRight from "@mui/icons-material/ChevronRight";
import type {
  ResourceLearningPathArticle,
  ResourceLearningPathCategory,
} from "@/lib/types";

function countLessons(category: ResourceLearningPathCategory): number {
  return category.articles.length + category.subcategories.reduce((total, subcategory) => {
    return total + subcategory.articles.length;
  }, 0);
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
  const query = term.trim().toLowerCase();

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
                name: selectedCategory.subcategories.length > 0 ? "More tutorials" : selectedCategory.name,
                description: null,
                articles: selectedCategory.articles,
              },
            ]
          : []),
      ]
    : [];
  const totalLessons = selectedCategory ? countLessons(selectedCategory) : 0;

  return (
    <div className="space-y-5">
      <label htmlFor="structured-resource-search" className="sr-only">
        Search tutorials
      </label>
      <div className="relative max-w-xl">
        <Search
          sx={{ fontSize: 20 }}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          id="structured-resource-search"
          type="search"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Search tutorials and topics"
          className="h-11 w-full rounded-lg border border-rule bg-paper pl-10 pr-4 text-sm text-ink outline-none focus-visible:ring-2 focus-visible:ring-focus"
        />
      </div>

      {filteredCategories.length === 0 ? (
        <div className="border-y border-rule py-12 text-center">
          <h2 className="font-display text-xl font-semibold text-ink">No tutorials found</h2>
          <p className="mt-2 text-sm text-muted">Try another topic or search term.</p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(13rem,0.28fr)_minmax(0,1fr)] lg:gap-12">
          <nav aria-label="Tutorial topics" className="min-w-0">
            <h2 className="mb-2 text-sm font-semibold text-muted">Topics</h2>
            <ul className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:block lg:space-y-1 lg:overflow-visible lg:pb-0">
              {filteredCategories.map((category) => {
                const active = selectedCategory?.id === category.id;
                const lessonCount = countLessons(category);
                return (
                  <li key={category.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedCategoryId(category.id)}
                      aria-current={active ? "true" : undefined}
                      className={`flex min-h-11 items-center justify-between gap-4 rounded-md px-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 lg:w-full ${
                        active
                          ? "bg-paper-3 font-semibold text-accent"
                          : "text-ink-2 hover:bg-paper-2 hover:text-ink"
                      }`}
                    >
                      <span className="whitespace-nowrap lg:whitespace-normal">{category.name}</span>
                      <span className="text-xs text-muted">{lessonCount}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {selectedCategory && (
            <main className="min-w-0">
              <header className="border-b border-rule pb-5">
                <p className="text-sm text-muted">{totalLessons} tutorials</p>
                <h2 className="mt-1 min-w-0 break-words font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
                  {selectedCategory.name}
                </h2>
                {selectedCategory.description && (
                  <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink-2">
                    {selectedCategory.description}
                  </p>
                )}
              </header>

              <div className="divide-y divide-rule">
                {chapters.map((chapter, chapterIndex) => (
                  <section key={chapter.id} className="py-5" aria-labelledby={`chapter-${chapter.id}`}>
                    <div className="mb-2">
                      <h3
                        id={`chapter-${chapter.id}`}
                        className="font-display text-lg font-semibold text-ink"
                      >
                        {chapter.name}
                      </h3>
                      {chapter.description && (
                        <p className="mt-1 text-sm leading-relaxed text-muted">{chapter.description}</p>
                      )}
                    </div>
                    <ol>
                      {chapter.articles.map((article, index) => {
                        const lessonNumber = String(index + 1).padStart(2, "0");
                        return (
                          <li key={article.id}>
                            <Link
                              href={`/resources/${article.slug}`}
                              className="group grid min-h-14 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-rule/70 py-3 last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                            >
                              <span className="text-sm tabular-nums text-muted">
                                {chapterIndex + 1}.{lessonNumber}
                              </span>
                              <span className="min-w-0">
                                <span className="block break-words text-sm font-medium text-ink group-hover:text-accent">
                                  {article.title}
                                </span>
                                {article.description && (
                                  <span className="mt-1 line-clamp-2 block text-sm leading-relaxed text-muted">
                                    {article.description}
                                  </span>
                                )}
                              </span>
                              <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs text-muted">
                                <AccessTime sx={{ fontSize: 14 }} aria-hidden />
                                {article.estimatedMinutes} min
                                <ChevronRight
                                  sx={{ fontSize: 16 }}
                                  aria-hidden
                                  className="text-accent"
                                />
                              </span>
                            </Link>
                          </li>
                        );
                      })}
                    </ol>
                  </section>
                ))}
              </div>
            </main>
          )}
        </div>
      )}
    </div>
  );
}
