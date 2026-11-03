"use client";

import { useMemo } from "react";
import Link from "next/link";
import Subject from "@mui/icons-material/Subject";
import PlayCircle from "@mui/icons-material/PlayCircle";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ExpandMore from "@mui/icons-material/ExpandMore";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Insights from "@mui/icons-material/Insights";
import Lock from "@mui/icons-material/Lock";
import { useCourseRoadmap } from "./useCourseRoadmap";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import AccessDenied from "@/components/ui/AccessDenied";
import { buttonClass } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const TYPE_LABEL: Record<string, string> = { VIDEO: "Video", READING: "Reading" };

function RoadmapSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading the roadmap…</span>
      <Skeleton className="h-44 rounded-xl" />
      <div className="space-y-4" aria-hidden>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-200 bg-white p-5">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="mt-3 h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RoadmapView({ slug }: { slug: string }) {
  const { detail, roadmap, completed, loading, error, code, reload } = useCourseRoadmap(slug);

  const flat = useMemo(() => (roadmap?.chapters ?? []).flatMap((c) => c.topics.flatMap((t) => t.lessons)), [roadmap]);
  const nextLesson = useMemo(() => flat.find((l) => l.isPublished && !completed.has(l.id)) ?? null, [flat, completed]);
  const totalLessons = flat.length;
  const doneCount = flat.filter((l) => completed.has(l.id)).length;
  const percent = totalLessons > 0 ? Math.round((doneCount / totalLessons) * 100) : 0;
  const allDone = totalLessons > 0 && doneCount === totalLessons;

  if (loading) return <RoadmapSkeleton />;
  if (error) {
    if (code === "FORBIDDEN" || code === "UNAUTHORIZED") {
      return (
        <AccessDenied
          title="You don’t have access to this roadmap"
          description="Only enrolled learners and course staff can open this curriculum."
        />
      );
    }
    return <ErrorState message={error} onRetry={() => void reload()} />;
  }
  if (!detail) return <ErrorState title="Course not found" message="This course could not be loaded." />;
  if (!roadmap) {
    return (
      <AccessDenied
        title="This roadmap is locked"
        description="Enroll in the course to open its curriculum."
        actions={false}
      />
    );
  }

  const courseSlug = detail.course.slug;
  const lessonHref = (lessonId: string) => `/dashboard/courses/${courseSlug}/lessons/${lessonId}`;

  return (
    <div className="space-y-8">
      <Link
        href={`/dashboard/courses/${courseSlug}`}
        className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-ink-2 hover:text-accent"
      >
        Back to course overview
      </Link>

      <section className="border-y border-rule bg-paper px-5 py-7 sm:px-8 sm:py-9">
        <div className="min-w-0 max-w-3xl">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{detail.course.title}</h1>
          {detail.course.description && (
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">{detail.course.description}</p>
          )}
          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-2">
            <span>Category: {detail.course.category}</span>
            <span className="inline-flex items-center gap-1.5">
              <Subject fontSize="small" aria-hidden /> {roadmap.chapters.length} chapters
            </span>
            <span className="inline-flex items-center gap-1.5">
              <PlayCircle fontSize="small" aria-hidden /> {totalLessons} lessons
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle fontSize="small" aria-hidden /> {doneCount} completed
            </span>
          </div>
        </div>
      </section>

      {/* Roadmap head + progress */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-paper-2 text-accent">
            <Insights aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Your roadmap</h2>
            <p className="text-sm text-muted">Complete each chapter in order. One step at a time.</p>
          </div>
        </div>
        <div className="w-full sm:w-56">
          <div className="flex items-center justify-between text-xs font-medium text-muted">
            <span>Progress</span>
            <span className="text-accent">{percent}%</span>
          </div>
          <div
            className="mt-2 h-2 w-full overflow-hidden rounded-full bg-paper-3"
            role="progressbar"
            aria-label="Course progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div
              className="h-full origin-left rounded-full bg-accent transition-transform duration-500 motion-reduce:transition-none"
              style={{ transform: `scaleX(${percent / 100})` }}
            />
          </div>
          <p className="mt-1.5 text-right text-[11px] text-muted">
            {doneCount} of {totalLessons} lessons completed
          </p>
        </div>
      </div>

      {totalLessons === 0 ? (
        <EmptyState title="The curriculum is empty" description="No lessons have been published for this course yet." />
      ) : (
        <ol className="relative space-y-3">
          {roadmap.chapters.map((chapter, index) => {
            const lessons = chapter.topics.flatMap((t) => t.lessons);
            const chapterDone = lessons.filter((l) => completed.has(l.id)).length;
            const chapterTotal = lessons.length;
            const complete = chapterTotal > 0 && chapterDone === chapterTotal;
            const isLast = index === roadmap.chapters.length - 1;
            return (
              <li key={chapter.id} className="relative pl-14">
                {!isLast && (
                  <span aria-hidden className="absolute left-[19px] top-11 h-[calc(100%+0.75rem)] w-px bg-rule" />
                )}
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 top-2.5 grid h-10 w-10 place-items-center rounded-full border-[3px] border-paper font-display text-sm font-semibold",
                    complete ? "bg-accent text-accent-ink" : "bg-ink text-paper",
                  )}
                >
                  {complete ? "✓" : index + 1}
                </span>

                <details className="group overflow-hidden border-y border-rule bg-paper" open={index === 0}>
                  <summary className="flex min-h-11 cursor-pointer list-none items-center gap-4 px-4 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40 sm:px-5 [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0 flex-1">
                      <span className="block font-display font-semibold text-ink">{chapter.title}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                        <span>{chapterTotal} {chapterTotal === 1 ? "lesson" : "lessons"}</span>
                        <span>{chapterDone} of {chapterTotal} completed</span>
                      </span>
                    </span>
                    <span className="hidden w-24 shrink-0 sm:block">
                      <span className="block text-[10px] font-semibold text-muted">{chapterDone}/{chapterTotal}</span>
                      <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-paper-3">
                        <span
                          className="block h-full origin-left rounded-full bg-accent"
                          style={{ transform: `scaleX(${chapterTotal ? chapterDone / chapterTotal : 0})` }}
                        />
                      </span>
                    </span>
                    <ExpandMore aria-hidden className="chapter-chevron shrink-0 text-ink-2" />
                  </summary>

                  <div className="border-t border-rule px-2 py-2 sm:px-3">
                    {chapterTotal === 0 ? (
                      <p className="px-3 py-2 text-sm text-muted">No lessons in this chapter yet.</p>
                    ) : (
                      <ul className="space-y-0.5">
                        {lessons.map((lesson, li) => {
                          const done = completed.has(lesson.id);
                          const playable = lesson.isPublished;
                          const num = `${index + 1}.${li + 1}`;
                          const row = (
                            <>
                              <LessonDot done={done} />
                              <span className="w-8 shrink-0 font-mono text-[11px] text-muted">{num}</span>
                              <span className="min-w-0 flex-1 truncate text-[15px] text-ink-2">{lesson.title}</span>
                              <span className="shrink-0 text-[11px] text-muted">{TYPE_LABEL[lesson.type] ?? lesson.type}</span>
                              <ArrowForward fontSize="inherit" aria-hidden className="shrink-0 text-accent" />
                            </>
                          );
                          return (
                            <li key={lesson.id}>
                              {playable ? (
                                <Link
                                  href={lessonHref(lesson.id)}
                                  className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 transition hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40"
                                >
                                  {row}
                                  <span className="sr-only">{done ? "completed" : "not completed"}</span>
                                </Link>
                              ) : (
                                <div className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 opacity-70">
                                  {row}
                                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-paper-2 px-2 py-0.5 text-[10px] font-semibold text-ink-2">
                                    <Lock fontSize="inherit" aria-hidden /> Locked
                                  </span>
                                </div>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      )}

      {/* Bottom CTA */}
      <section className="flex flex-col gap-4 border-y border-rule bg-paper-2 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display font-semibold text-ink">
            {allDone ? "Course completed. Excellent work!" : "Keep building your skills."}
          </p>
          <p className="mt-0.5 text-sm text-muted">
            {allDone
              ? "You’ve completed every lesson in this roadmap."
              : nextLesson
                ? `Next up: ${nextLesson.title}`
                : "Continue your learning journey."}
          </p>
        </div>
        {nextLesson ? (
          <Link href={lessonHref(nextLesson.id)} className={buttonClass("primary", "md", "w-full shrink-0 sm:w-auto")}>
            Continue learning <ArrowForward fontSize="small" aria-hidden />
          </Link>
        ) : (
          <Link href={`/dashboard/courses/${courseSlug}`} className={buttonClass("secondary", "md", "w-full shrink-0 sm:w-auto")}>
            Review course
          </Link>
        )}
      </section>
    </div>
  );
}

function LessonDot({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[10px]",
        done ? "border-accent bg-accent text-accent-ink" : "border-rule",
      )}
    >
      {done ? "✓" : ""}
    </span>
  );
}
