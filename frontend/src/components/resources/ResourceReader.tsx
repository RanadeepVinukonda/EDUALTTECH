"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ArrowForward from "@mui/icons-material/ArrowForward";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ExpandMore from "@mui/icons-material/ExpandMore";
import MenuBook from "@mui/icons-material/MenuBook";
import { cn } from "@/lib/cn";
import type { ResourceChapter, ResourceLesson, ResourceTutorial } from "@/lib/types";
import MarkdownArticleViewer from "@/components/ui/MarkdownArticleViewer";

type FlatLesson = ResourceLesson & {
  chapterId: string;
  chapterTitle: string;
  topicId: string;
  topicTitle: string;
};

function flatten(resource: ResourceTutorial): FlatLesson[] {
  return resource.chapters.flatMap((chapter) =>
    chapter.topics.flatMap((topic) =>
      topic.lessons.map((lesson) => ({
        ...lesson,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        topicId: topic.id,
        topicTitle: topic.title,
      })),
    ),
  );
}

function readingMinutes(text: string | null): number {
  const words = text?.trim().split(/\s+/).filter(Boolean).length ?? 0;
  return Math.max(1, Math.ceil(words / 220));
}

function chapterLessons(chapter: ResourceChapter): ResourceLesson[] {
  return chapter.topics.flatMap((topic) => topic.lessons);
}

export default function ResourceReader({ resource }: { resource: ResourceTutorial }) {
  const lessons = useMemo(() => flatten(resource), [resource]);
  const [activeId, setActiveId] = useState(lessons[0]?.id ?? "");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [closedChapters, setClosedChapters] = useState<Set<string>>(new Set());

  const activeIndex = lessons.findIndex((lesson) => lesson.id === activeId);
  const active = lessons[activeIndex] ?? lessons[0] ?? null;
  const previous = activeIndex > 0 ? lessons[activeIndex - 1] : null;
  const next = activeIndex >= 0 && activeIndex < lessons.length - 1 ? lessons[activeIndex + 1] : null;

  function selectLesson(id: string) {
    setActiveId(id);
    setSidebarOpen(false);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleChapter(id: string) {
    setClosedChapters((current) => {
      const nextSet = new Set(current);
      if (nextSet.has(id)) nextSet.delete(id);
      else nextSet.add(id);
      return nextSet;
    });
  }

  return (
    <div className="bg-white">
      <div className="sticky top-16 z-30 border-y border-slate-200 bg-white shadow-[0_2px_20px_-10px_rgba(17,17,17,0.17)]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ul className="flex items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {resource.chapters.map((chapter) => {
              const isCurrent = active?.chapterId === chapter.id;
              return (
                <li key={chapter.id} className="shrink-0 p-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      const first = chapterLessons(chapter)[0];
                      if (first) selectLesson(first.id);
                    }}
                    aria-current={isCurrent ? "true" : undefined}
                    className={cn(
                      "whitespace-nowrap text-[15px] text-[#273239] transition-colors hover:text-[#308d46]",
                      isCurrent && "font-bold text-[#308d46]",
                    )}
                  >
                    {chapter.title}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen((value) => !value)}
            aria-expanded={sidebarOpen}
            className="flex w-full items-center justify-between border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-ink-900"
          >
            <span className="inline-flex items-center gap-2">
              <MenuBook fontSize="small" className="text-[#308d46]" />
              Tutorial contents
            </span>
            <ExpandMore fontSize="small" className={cn("transition-transform", sidebarOpen && "rotate-180")} />
          </button>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <aside
            className={cn(
              "lg:block lg:w-[18%] lg:min-w-[220px] lg:max-w-[300px] lg:shrink-0",
              sidebarOpen ? "block" : "hidden",
            )}
          >
            <div className="lg:sticky lg:top-[112px]">
              <div className="max-h-[calc(100vh-140px)] overflow-y-auto bg-[#f9f9f9] [scrollbar-width:thin]">
                {resource.chapters.map((chapter) => {
                  const isOpen = !closedChapters.has(chapter.id);
                  return (
                    <div key={chapter.id}>
                      <button
                        type="button"
                        onClick={() => toggleChapter(chapter.id)}
                        aria-expanded={isOpen}
                        className="flex w-full items-center justify-between border-b border-[#e5e5e5] px-[15px] py-2.5 text-left text-[15px] text-black transition-[font-weight] hover:font-bold"
                      >
                        <span>{chapter.title}</span>
                        <ExpandMore
                          fontSize="small"
                          aria-hidden
                          className={cn("transition-transform", isOpen && "rotate-180")}
                        />
                      </button>
                      {isOpen && (
                        <ul className="mb-2 ml-2">
                          {chapterLessons(chapter).map((lesson) => {
                            const isActive = lesson.id === active?.id;
                            return (
                              <li key={lesson.id}>
                                <button
                                  type="button"
                                  onClick={() => selectLesson(lesson.id)}
                                  aria-current={isActive ? "page" : undefined}
                                  className={cn(
                                    "block w-full border-l-4 border-transparent px-[15px] py-0.5 text-left text-[15px] leading-relaxed text-black transition-[font-weight] hover:font-bold",
                                    isActive && "border-[#308d46] font-bold",
                                  )}
                                >
                                  {lesson.title}
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>

          <article className="min-w-0 flex-1 lg:max-w-[860px]">
            {active ? (
              <>
                <nav aria-label="Breadcrumb">
                  <ol className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
                    <li>
                      <Link href="/resources" className="hover:text-[#308d46]">
                        Resources
                      </Link>
                    </li>
                    <li aria-hidden className="text-slate-400">
                      <ChevronRight fontSize="small" />
                    </li>
                    <li className="text-slate-700">{resource.title}</li>
                  </ol>
                </nav>
                <h1 className="mt-3 text-[26px] font-bold leading-tight text-[#0e0e12] sm:text-[30px]">
                  {active.title}
                </h1>
                <p className="mt-2 border-b border-slate-200 pb-4 text-sm text-slate-500">
                  {active.chapterTitle} / {active.topicTitle} | Free tutorial | {readingMinutes(active.textContent)} min read
                </p>

                {active.type === "VIDEO" && active.contentUrl ? (
                  <div className="mt-6 overflow-hidden border border-slate-200 bg-black">
                    <video controls className="w-full" src={active.contentUrl}>
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : active.textContent?.trim() ? (
                  <MarkdownArticleViewer content={active.textContent} className="mt-5" />
                ) : (
                  <p className="mt-6 border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    This lesson has no written content yet.
                  </p>
                )}

                {active.contentUrl && active.type !== "VIDEO" && (
                  <a
                    href={active.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex text-sm font-semibold text-[#308d46] underline underline-offset-2 hover:text-[#1d6d33]"
                  >
                    Open lesson link
                  </a>
                )}

                <nav aria-label="Lesson navigation" className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-6">
                  {previous ? (
                    <button
                      type="button"
                      onClick={() => selectLesson(previous.id)}
                      className="inline-flex max-w-[48%] items-center gap-2 border border-slate-200 px-4 py-2 text-left text-sm font-semibold text-slate-700 transition hover:border-[#308d46] hover:text-[#308d46]"
                    >
                      <ArrowBack fontSize="small" />
                      <span className="truncate">{previous.title}</span>
                    </button>
                  ) : (
                    <Link
                      href="/resources"
                      className="inline-flex items-center gap-2 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#308d46] hover:text-[#308d46]"
                    >
                      <ArrowBack fontSize="small" />
                      All resources
                    </Link>
                  )}
                  {next ? (
                    <button
                      type="button"
                      onClick={() => selectLesson(next.id)}
                      className="inline-flex max-w-[48%] items-center gap-2 border border-slate-200 px-4 py-2 text-right text-sm font-semibold text-slate-700 transition hover:border-[#308d46] hover:text-[#308d46]"
                    >
                      <span className="truncate">{next.title}</span>
                      <ArrowForward fontSize="small" />
                    </button>
                  ) : (
                    <Link
                      href="/resources"
                      className="inline-flex items-center gap-2 border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#308d46] hover:text-[#308d46]"
                    >
                      Back to resources
                      <ArrowForward fontSize="small" />
                    </Link>
                  )}
                </nav>
              </>
            ) : (
              <p className="border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                This tutorial does not have any lessons yet.
              </p>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
