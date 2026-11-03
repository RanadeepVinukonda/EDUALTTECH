"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";
import { describeError, errorCode } from "@/lib/errors";
import type { CourseDetailResponse, LessonRow, Roadmap } from "@/lib/app-types";
import { cn } from "@/lib/cn";
import { notifyError, notifySuccess } from "@/lib/notify";
import Button, { buttonClass } from "@/components/ui/Button";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import MarkdownArticleViewer from "@/components/ui/MarkdownArticleViewer";
import ChatView from "./ChatView";
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";

function CourseSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading course…</span>
      <div className="rounded-xl border border-rule bg-paper p-6" aria-hidden>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-3 h-8 w-2/3" />
        <Skeleton className="mt-2 h-4 w-1/3" />
        <Skeleton className="mt-5 h-2 w-full rounded-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]" aria-hidden>
        <div className="rounded-xl border border-rule bg-paper p-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-7 w-1/2" />
          <Skeleton className="mt-5 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-11/12" />
          <Skeleton className="mt-2 h-4 w-9/12" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-rule bg-paper p-4">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-2 h-4 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CourseOverviewView({ slug }: { slug: string }) {
  const [detail, setDetail] = useState<CourseDetailResponse | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string | null>(null);
  const [selected, setSelected] = useState<LessonRow | null>(null);
  const [marking, setMarking] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    setCode(null);
    try {
      const d = await apiGet<CourseDetailResponse>(`/courses/${slug}`);
      setDetail(d);
      setProgress(d.myParticipation?.progressPct ?? 0);
      if (d.access.canRead) {
        const rm = await apiGet<Roadmap>(`/courses/${d.course.id}/roadmap`);
        setRoadmap(rm);
        setCompleted(new Set(rm.completedLessonIds));
      } else {
        setRoadmap(null);
      }
    } catch (err) {
      setError(describeError(err, "Could not load this course."));
      setCode(errorCode(err));
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const lessons = useMemo(
    () => (roadmap?.chapters ?? []).flatMap((c) => c.topics.flatMap((t) => t.lessons)),
    [roadmap],
  );
  const nextLesson = useMemo(
    () => lessons.find((l) => l.isPublished && !completed.has(l.id)) ?? lessons.find((l) => l.isPublished) ?? lessons[0] ?? null,
    [lessons, completed],
  );
  const selectedIndex = useMemo(
    () => (selected ? lessons.findIndex((l) => l.id === selected.id) : -1),
    [lessons, selected],
  );
  const prev = selectedIndex > 0 ? lessons[selectedIndex - 1] : null;
  const next = selectedIndex >= 0 ? lessons[selectedIndex + 1] ?? null : null;

  useEffect(() => {
    if (selected || !roadmap || !detail) return;
    const resumeTopicId = detail.myParticipation?.currentTopicId;
    if (resumeTopicId) {
      for (const chapter of roadmap.chapters) {
        const topic = chapter.topics.find((t) => t.id === resumeTopicId);
        const open = topic?.lessons.find((l) => l.isPublished) ?? topic?.lessons[0];
        if (open) {
          setSelected(open);
          return;
        }
      }
    }
    if (nextLesson) setSelected(nextLesson);
  }, [selected, roadmap, detail, nextLesson]);

  async function openTopic(topicId: string) {
    if (!detail || detail.myParticipation?.role !== "LEARNER") return;
    try {
      await apiPost(`/courses/${detail.course.id}/open-topic`, { topicId });
    } catch {
      /* non-critical positional bookmark */
    }
  }

  async function markComplete(lesson: LessonRow) {
    if (!detail) return;
    setMarking(true);
    try {
      const res = await apiPost<{ progressPct: number }>(`/courses/lessons/${lesson.id}/complete`);
      setProgress(res.progressPct);
      setCompleted((prevSet) => new Set(prevSet).add(lesson.id));
      notifySuccess("Lesson marked complete.");
    } catch (err) {
      notifyError(describeError(err, "Could not update progress."));
    } finally {
      setMarking(false);
    }
  }

  if (error) {
    if (code === "NOT_FOUND") {
      return (
        <div
          role="status"
          className="mx-auto max-w-lg border-y border-rule bg-paper px-5 py-10 text-center sm:px-8"
        >
          <h1 className="font-display text-xl font-semibold text-ink-900">Course not in your learning area</h1>
          <p className="mt-2 text-sm text-slate-500">
            It may not be published yet, or you&apos;re not enrolled. Visit the course page to enroll and start learning.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href={`/courses/${slug}`} className={buttonClass("primary", "sm")}>
              View course
            </Link>
            <Link href="/courses" className={buttonClass("secondary", "sm")}>
              Browse courses
            </Link>
          </div>
        </div>
      );
    }
    return <ErrorState message={error} onRetry={() => void load()} />;
  }
  if (!detail) return <CourseSkeleton />;

  const { course, access, myParticipation } = detail;
  const isLearner = myParticipation?.role === "LEARNER";
  const enrolled = access.canRead;

  if (!enrolled) {
    return (
      <div
        role="alert"
        className="border-y border-rule bg-paper px-5 py-10 text-center sm:px-8"
      >
        <h1 className="font-display text-xl font-semibold text-ink-900">You&apos;re not enrolled in this course</h1>
        <p className="mt-2 text-sm text-slate-500">Visit the course page to enroll and start learning.</p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href={`/courses/${course.slug}`} className={buttonClass("primary", "sm")}>
            View course
          </Link>
          <Link href="/courses" className={buttonClass("secondary", "sm")}>
            Browse courses
          </Link>
        </div>
      </div>
    );
  }
  if (!roadmap) return <CourseSkeleton />;

  return (
    <div className="overflow-hidden border-y border-rule bg-paper">
      <div
        className="h-1 w-full bg-paper-3"
        role="progressbar"
        aria-label={`${course.title} progress`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div
          className="h-full origin-left rounded-full bg-accent transition-transform duration-500 motion-reduce:transition-none"
          style={{ transform: `scaleX(${progress / 100})` }}
        />
      </div>

      <header className="flex flex-wrap items-center gap-x-4 gap-y-3 border-b border-rule px-4 py-5 sm:px-6">
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-xl font-semibold text-ink">{course.title}</h1>
          <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
            <span>{course.category}</span>
            <span>{course.enrolledCount} learners</span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          {isLearner && (
            <span className="text-sm font-semibold text-accent" aria-live="polite">
              {progress}% complete
            </span>
          )}
          {!isLearner && <span className="text-sm text-muted">Mentor and staff view, read only</span>}
          <Link href={`/dashboard/courses/${course.slug}/roadmap`} className="inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline">
            Full roadmap
          </Link>
          <Link href={`/courses/${course.slug}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline">
            Course page
          </Link>
        </div>
      </header>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,340px)]">
        <div className="order-1 min-w-0">
          {selected ? (
            <article>
              <div className="flex items-start gap-3 px-4 py-5 sm:px-6">
                <div className="min-w-0 flex-1">
                  <h2 className="mt-1 font-display text-xl font-semibold text-ink">{selected.title}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {selected.type === "VIDEO" ? "Video" : "Reading"}
                  </p>
                </div>
                <div className="hidden items-center gap-1 sm:flex">
                  <button
                    type="button"
                    disabled={!prev}
                    onClick={() => prev && setSelected(prev)}
                    aria-label="Previous lesson"
                    className="grid h-11 w-11 place-items-center rounded-lg border border-rule text-muted transition hover:bg-paper-2 disabled:opacity-40"
                  >
                    <ChevronLeft fontSize="small" aria-hidden />
                  </button>
                  <button
                    type="button"
                    disabled={!next}
                    onClick={() => next && setSelected(next)}
                    aria-label="Next lesson"
                    className="grid h-11 w-11 place-items-center rounded-lg border border-rule text-muted transition hover:bg-paper-2 disabled:opacity-40"
                  >
                    <ChevronRight fontSize="small" aria-hidden />
                  </button>
                </div>
              </div>

              <div className="px-4 pb-6 sm:px-6">
                {!selected.isPublished && !access.isStaff ? (
                  <div className="border border-dashed border-rule bg-paper-2 p-4 text-sm text-muted">
                    This lesson is not available yet. Your mentor will make it available when its video or live class is ready.
                  </div>
                ) : selected.type === "VIDEO" ? (
                  <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 rounded-xl border border-slate-200 bg-slate-900 px-6 py-10 text-center">
                    <p className="font-display text-lg font-semibold text-white">Video lesson</p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      {selected.hasVideo && (
                        <Link
                          href={`/dashboard/courses/${course.slug}/lessons/${selected.id}`}
                          className={buttonClass("primary", "sm")}
                        >
                          Play
                        </Link>
                      )}
                      {selected.contentUrl && (
                        <a
                          href={selected.contentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                          Open video lesson
                        </a>
                      )}
                      {!selected.hasVideo && !selected.contentUrl && (
                        <p className="text-sm text-white/60">No video has been added to this lesson yet.</p>
                      )}
                    </div>
                  </div>
                ) : selected.textContent ? (
                  <MarkdownArticleViewer content={selected.textContent} />
                ) : (
                  <p className="text-sm text-muted">No content has been added to this lesson yet.</p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 border-t border-rule bg-paper-2/70 px-4 py-4 sm:px-6">
                {isLearner && selected.isPublished ? (
                  completed.has(selected.id) ? (
                    <span className="text-sm font-semibold text-accent">Completed</span>
                  ) : (
                    <Button onClick={() => void markComplete(selected)} loading={marking}>
                      Mark as complete
                    </Button>
                  )
                ) : (
                  <span className="text-sm text-muted">Preview</span>
                )}
                <div className="ml-auto flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!prev}
                    onClick={() => prev && setSelected(prev)}
                    className="min-h-11 rounded-lg border border-rule bg-paper px-4 py-2 text-sm font-semibold text-ink-2 transition hover:bg-paper-2 disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={!next}
                    onClick={() => next && setSelected(next)}
                    className="min-h-11 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition hover:bg-brand-700 disabled:opacity-40"
                  >
                    Next lesson
                  </button>
                </div>
              </div>
            </article>
          ) : (
            <div className="px-6 py-16 text-center text-sm text-muted">Select a lesson to begin.</div>
          )}

          {isLearner && (
            <div className="border-t border-rule px-4 py-5 sm:px-6">
              <h2 className="mb-3 font-display font-semibold text-ink">Messages</h2>
              <ChatView courseId={course.id} compact />
            </div>
          )}
        </div>

        <aside aria-label="Course content" className="order-2 border-t border-rule bg-paper-2/60 lg:border-l lg:border-t-0">
          <div className="px-4 py-4 sm:px-5">
            <h2 className="text-sm font-semibold text-muted">Course content</h2>
          </div>
          <div className="divide-y divide-rule">
            {course.chapters
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((chapter, chapterIndex) => {
                const rm = roadmap.chapters.find((c) => c.id === chapter.id);
                const containsSelected = rm?.topics.some((t) => t.lessons.some((l) => l.id === selected?.id));
                const done = rm?.topics.flatMap((t) => t.lessons).filter((l) => completed.has(l.id)).length ?? 0;
                const total = rm?.topics.flatMap((t) => t.lessons).length ?? 0;
                return (
                  <details key={chapter.id} open={Boolean(containsSelected)} className="group">
                    <summary className="flex min-h-11 cursor-pointer list-none items-start gap-3 px-4 py-4 hover:bg-paper-2">
                      <span className="mt-0.5 text-xs font-semibold text-muted">{chapterIndex + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink">{chapter.title}</span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {done}/{total} lessons done
                        </span>
                      </span>
                      <ChevronRight
                        fontSize="small"
                        aria-hidden
                        className="mt-0.5 shrink-0 text-muted transition-transform motion-reduce:transition-none group-open:rotate-90"
                      />
                    </summary>
                    <ol className="pb-2">
                      {rm?.topics.map((topic) => (
                        <li key={topic.id} className="pt-1">
                          <p className="px-4 pb-1 pl-9 text-xs font-medium text-muted">
                            {topic.title}
                          </p>
                          <ul>
                            {topic.lessons.map((lesson) => {
                              const isDone = completed.has(lesson.id);
                              const active = selected?.id === lesson.id;
                              const locked = !lesson.isPublished && !access.isStaff;
                              if (locked) {
                                return (
                                  <li key={lesson.id}>
                                    <div className="flex min-h-11 items-center gap-2 px-4 py-2 pl-9 text-sm text-muted">
                                      <span className="truncate">{lesson.title}</span>
                                      <span className="ml-auto shrink-0 text-[11px]">Locked</span>
                                    </div>
                                  </li>
                                );
                              }
                              return (
                                <li key={lesson.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelected(lesson);
                                      void openTopic(topic.id);
                                    }}
                                    aria-current={active ? "true" : undefined}
                                    className={cn(
                                      "flex min-h-11 w-full items-center gap-2 px-4 py-2 pl-9 text-left text-sm transition-colors",
                                      active
                                        ? "bg-paper-3/70 font-medium text-ink"
                                        : "text-ink-2 hover:bg-paper-2",
                                    )}
                                  >
                                    <span className="truncate">{lesson.title}</span>
                                    <span className="ml-auto shrink-0 text-[11px] text-muted">
                                      {isDone ? "Complete" : lesson.type === "VIDEO" ? "Video" : "Reading"}
                                    </span>
                                    <span className="sr-only">
                                      {isDone ? "completed" : lesson.type === "VIDEO" ? "video" : "reading"}
                                    </span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </li>
                      ))}
                    </ol>
                  </details>
                );
              })}
            {course.chapters.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-muted">The roadmap is still being prepared.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
