"use client";

import { useMemo } from "react";
import Link from "next/link";
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
      <div aria-hidden>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-3 h-9 w-2/3" />
        <Skeleton className="mt-2 h-4 w-1/3" />
      </div>
      <div className="space-y-4" aria-hidden>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-elev1">
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="mt-3 h-4 w-1/2" />
            <Skeleton className="mt-3 h-4 w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RoadmapView({ slug }: { slug: string }) {
  const { detail, roadmap, completed, loading, error, code, reload } = useCourseRoadmap(slug);

  const flat = useMemo(() => (roadmap?.chapters ?? []).flatMap((c) => c.topics.flatMap((t) => t.lessons)), [roadmap]);
  const nextLesson = useMemo(() => flat.find((l) => !completed.has(l.id)) ?? null, [flat, completed]);
  const totalLessons = flat.length;
  const doneCount = flat.filter((l) => completed.has(l.id)).length;

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

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/dashboard/courses/${detail.course.slug}`} className="text-sm font-semibold text-brand-700 hover:underline">
          ← Back to course overview
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-ink-900">{detail.course.title}</h1>
        <p className="mt-1 text-[15px] text-slate-500">
          Roadmap{totalLessons > 0 ? ` · ${doneCount} of ${totalLessons} lessons complete` : ""}
        </p>
      </div>

      {totalLessons > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          {nextLesson ? (
            <Link href={`/dashboard/courses/${detail.course.slug}/lessons/${nextLesson.id}`} className={buttonClass("primary", "sm")}>
              Continue learning
            </Link>
          ) : (
            <p className="rounded-xl bg-green-50 px-4 py-2 text-sm font-semibold text-green-800">
              Curriculum complete — nice work.
            </p>
          )}
        </div>
      )}

      {totalLessons === 0 ? (
        <EmptyState title="The curriculum is empty" description="No lessons have been published for this course yet." />
      ) : (
        <ol className="space-y-4">
          {roadmap.chapters.map((chapter, index) => {
            const chapterDone = chapter.topics.flatMap((t) => t.lessons).filter((l) => completed.has(l.id)).length;
            const chapterTotal = chapter.topics.reduce((n, t) => n + t.lessons.length, 0);
            return (
              <li key={chapter.id}>
                <details className="rounded-[20px] border border-slate-200 bg-white shadow-elev1" open={index === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40">
                    <span>
                      <span className="font-display font-bold text-ink-900">{chapter.title}</span>
                      {chapter.summary && <span className="mt-0.5 block text-sm text-slate-500">{chapter.summary}</span>}
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-slate-500">
                      {chapterTotal > 0 ? `${chapterDone}/${chapterTotal}` : "No lessons"}
                    </span>
                  </summary>

                  <div className="border-t border-slate-100 px-5 py-3">
                    {chapter.topics.length === 0 ? (
                      <p className="py-2 text-sm text-slate-500">No topics in this chapter yet.</p>
                    ) : (
                      chapter.topics.map((topic) => (
                        <section key={topic.id} className="py-3">
                          <h3 className="font-display text-sm font-bold uppercase tracking-wide text-ink-700">{topic.title}</h3>
                          {topic.summary && <p className="mt-1 text-sm text-slate-500">{topic.summary}</p>}
                          {topic.lessons.length === 0 ? (
                            <p className="mt-2 text-sm text-slate-400">No lessons yet.</p>
                          ) : (
                            <ul className="mt-2 space-y-1">
                              {topic.lessons.map((lesson) => {
                                const done = completed.has(lesson.id);
                                const playable = lesson.isPublished;
                                return (
                                  <li key={lesson.id}>
                                    {playable ? (
                                      <Link
                                        href={`/dashboard/courses/${detail.course.slug}/lessons/${lesson.id}`}
                                        className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
                                      >
                                        <LessonDot done={done} />
                                        <span className="min-w-0 flex-1 truncate text-[15px] text-ink-800">{lesson.title}</span>
                                        <span className="shrink-0 text-xs text-slate-400">{TYPE_LABEL[lesson.type] ?? lesson.type}</span>
                                        <span className="sr-only">{done ? "completed" : "not completed"}</span>
                                      </Link>
                                    ) : (
                                      <div className="flex items-center gap-3 rounded-lg px-2 py-2 opacity-70">
                                        <LessonDot done={false} />
                                        <span className="min-w-0 flex-1 truncate text-[15px] text-ink-800">{lesson.title}</span>
                                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                          Draft
                                        </span>
                                      </div>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </section>
                      ))
                    )}
                  </div>
                </details>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function LessonDot({ done }: { done: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[10px]",
        done ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300",
      )}
    >
      {done ? "✓" : ""}
    </span>
  );
}
