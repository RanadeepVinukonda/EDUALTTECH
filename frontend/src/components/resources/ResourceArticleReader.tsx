"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import BookmarkBorder from "@mui/icons-material/BookmarkBorder";
import Bookmark from "@mui/icons-material/Bookmark";
import Share from "@mui/icons-material/Share";
import Check from "@mui/icons-material/Check";
import AccessTime from "@mui/icons-material/AccessTime";
import Visibility from "@mui/icons-material/Visibility";
import ChevronRight from "@mui/icons-material/ChevronRight";
import type { ResourceArticleDetail } from "@/lib/types";
import { cn } from "@/lib/cn";
import { apiPost } from "@/lib/api";
import MarkdownArticleViewer from "@/components/ui/MarkdownArticleViewer";
import LinkButton from "@/components/ui/LinkButton";

interface Props {
  article: ResourceArticleDetail;
}

interface TocItem {
  id: string;
  title: string;
  level: number;
}

function extractTableOfContents(markdown: string): TocItem[] {
  const lines = markdown.split("\n");
  const toc: TocItem[] = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      const title = trimmed.slice(3).replace(/[*`_]/g, "").trim();
      const id = title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      toc.push({ id, title, level: 2 });
    } else if (trimmed.startsWith("# ")) {
      const title = trimmed.slice(2).replace(/[*`_]/g, "").trim();
      const id = title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-");
      toc.push({ id, title, level: 1 });
    }
  });
  return toc;
}

export default function ResourceArticleReader({ article }: Props) {
  const [isBookmarked, setIsBookmarked] = useState(article.isBookmarked ?? false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const toc = useMemo(() => extractTableOfContents(article.content), [article.content]);

  async function handleToggleBookmark() {
    if (bookmarkLoading) return;
    setBookmarkLoading(true);
    const prev = isBookmarked;
    setIsBookmarked(!prev);
    try {
      const res = await apiPost<{ bookmarked: boolean }>(`/resources/article/${article.id}/bookmark`);
      setIsBookmarked(res.bookmarked);
    } catch {
      setIsBookmarked(prev);
    } finally {
      setBookmarkLoading(false);
    }
  }

  async function handleShare() {
    try {
      if (typeof window !== "undefined") {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }
    } catch {
      // ignore
    }
  }

  const updatedDate = new Date(article.updatedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-paper pb-20">
      {/* Top Breadcrumb & Metadata Bar */}
      <div className="border-b border-slate-200 bg-paper-2">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
            <Link href="/" className="hover:text-brand-700 transition">
              Home
            </Link>
            <ChevronRight fontSize="small" className="text-slate-400" />
            <Link href="/resources" className="hover:text-brand-700 transition">
              Resources
            </Link>
            {article.category && (
              <>
                <ChevronRight fontSize="small" className="text-slate-400" />
                <span className="text-slate-700">{article.category.name}</span>
              </>
            )}
            {article.subcategory && (
              <>
                <ChevronRight fontSize="small" className="text-slate-400" />
                <span className="text-slate-700">{article.subcategory.name}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
          {/* Main Article Body */}
          <main className="min-w-0 max-w-[740px] flex-1">
            {/* Title */}
            <h1 className="font-display text-display-s font-semibold tracking-tight text-ink-900 leading-tight">
              {article.title}
            </h1>

            {/* Metadata */}
            <div className="mt-3.5 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                {article.subcategory?.name || article.category?.name || "Tutorial"}
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500 pl-1">
                <AccessTime sx={{ fontSize: 14 }} />
                {article.estimatedMinutes} min read
              </span>
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <Visibility sx={{ fontSize: 14 }} />
                {article.views.toLocaleString()} reads
              </span>
            </div>

            <p className="mt-3.5 text-base leading-relaxed text-slate-600 border-b border-slate-200 pb-5">
              {article.description}
            </p>

            {/* Author Attribution & Action Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-ink-900">{article.authorAttribution || "EduAltTech Academic Team"}</span>
                <span>•</span>
                <span>Updated {updatedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleBookmark}
                  disabled={bookmarkLoading}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
                    isBookmarked
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                  aria-label={isBookmarked ? "Remove bookmark" : "Bookmark tutorial"}
                >
                  {isBookmarked ? (
                    <Bookmark sx={{ fontSize: 16 }} className="text-brand-600" />
                  ) : (
                    <BookmarkBorder sx={{ fontSize: 16 }} />
                  )}
                  <span>{isBookmarked ? "Saved" : "Save"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  aria-label="Share tutorial link"
                >
                  {copied ? (
                    <>
                      <Check sx={{ fontSize: 16 }} className="text-brand-600" />
                      <span className="text-brand-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share sx={{ fontSize: 16 }} />
                      <span>Share</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Markdown Content */}
            <div className="mt-8">
              <MarkdownArticleViewer content={article.content} />
            </div>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-slate-200 pt-6">
                <span className="text-sm font-medium text-muted">Related topics</span>
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200 transition"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Ecosystem Bridge: Resource -> Structured Course */}
            {article.linkedCourse && (
              <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 p-6 sm:p-8">
                <h3 className="mt-2 font-display text-xl font-semibold text-ink-900">
                  Continue with {article.linkedCourse.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  {article.linkedCourse.description ||
                    "Master this topic with direct 1-on-1 mentor guidance, weekly live workshops, code and project reviews, and a personalized learning roadmap."}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <LinkButton href={`/courses/${article.linkedCourse.slug}`} variant="primary">
                    View Complete Course & Syllabus
                  </LinkButton>
                  <span className="text-xs text-slate-500">
                    Includes live mentor sessions and asynchronous doubt support
                  </span>
                </div>
              </div>
            )}

            {/* Next / Previous Navigation */}
            <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-slate-200 pt-6">
              {article.prevArticle ? (
                <Link
                  href={`/resources/${article.prevArticle.slug}`}
                  className="group flex max-w-[48%] flex-col rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-600 "
                >
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-brand-700">
                    Previous Tutorial
                  </span>
                  <span className="mt-1 truncate font-display text-sm font-semibold text-ink-900">
                    {article.prevArticle.title}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/resources"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  <span>Browse all tutorials</span>
                </Link>
              )}

              {article.nextArticle && (
                <Link
                  href={`/resources/${article.nextArticle.slug}`}
                  className="group flex max-w-[48%] flex-col items-end text-right rounded-xl border border-slate-200 bg-white p-4 transition hover:border-brand-600 hover:ml-auto"
                >
                  <span className="flex items-center gap-1 text-xs font-semibold text-slate-500 group-hover:text-brand-700">
                    Next Tutorial
                  </span>
                  <span className="mt-1 truncate font-display text-sm font-semibold text-ink-900">
                    {article.nextArticle.title}
                  </span>
                </Link>
              )}
            </div>
          </main>

          {/* Table of Contents & Quick Navigation Sticky Sidebar */}
          <aside className="hidden lg:block lg:w-64 lg:shrink-0">
            <div className="sticky top-24 space-y-6">
              {toc.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-5">
                  <h2 className="font-display text-sm font-semibold text-slate-500">
                    On this page
                  </h2>
                  <nav className="mt-3 space-y-1.5" aria-label="Table of contents">
                    {toc.map((item, idx) => (
                      <a
                        key={`${item.id}-${idx}`}
                        href={`#${item.id}`}
                        className={cn(
                          "block text-xs leading-relaxed text-slate-600 hover:text-brand-700 transition",
                          item.level === 2 && "pl-2 border-l border-slate-200",
                        )}
                      >
                        {item.title}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {/* Resource Summary Card */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <h3 className="font-display text-sm font-semibold text-ink-900">EduAltTech Knowledge Base</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
                  Open-access educational guides created by industry experts and faculty. Independent, self-paced, and free forever.
                </p>
                <Link
                  href="/resources"
                  className="mt-4 block rounded-xl bg-slate-100 py-2 text-center text-xs font-semibold text-slate-800 hover:bg-slate-200 transition"
                >
                  Explore All Topics
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
