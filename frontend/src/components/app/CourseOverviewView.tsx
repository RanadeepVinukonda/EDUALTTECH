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

function CourseSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading course…</span>
      <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1" aria-hidden>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-3 h-8 w-2/3" />
        <Skeleton className="mt-2 h-4 w-1/3" />
        <Skeleton className="mt-5 h-2 w-full rounded-full" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]" aria-hidden>
        <div className="order-2 space-y-3 lg:order-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-elev1">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="mt-3 h-4 w-3/4" />
              <Skeleton className="mt-2 h-4 w-2/3" />
            </div>
          ))}
        </div>
        <div className="order-1 rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1 lg:order-2" aria-hidden>
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-7 w-1/2" />
          <Skeleton className="mt-5 h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-11/12" />
          <Skeleton className="mt-2 h-4 w-9/12" />
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
    () => lessons.find((l) => !completed.has(l.id)) ?? lessons[0] ?? null,
    [lessons, completed],
  );

  useEffect(() => {
    if (!selected && nextLesson) setSelected(nextLesson);
  }, [selected, nextLesson]);

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
      setCompleted((prev) => new Set(prev).add(lesson.id));
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
          className="mx-auto max-w-lg rounded-[20px] border border-slate-200 bg-white p-8 text-center shadow-elev1"
        >
          <h1 className="font-display text-xl font-bold text-ink-900">This course isn&apos;t in your learning area</h1>
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
  if (!detail || !roadmap) return <CourseSkeleton />;

  const { course, access, myParticipation } = detail;
  const isLearner = myParticipation?.role === "LEARNER";

  if (!access.canRead || (!isLearner && !access.isStaff)) {
    return (
      <div
        role="alert"
        className="rounded-[20px] border border-slate-200 bg-white p-8 text-center shadow-elev1"
      >
        <h1 className="font-display text-xl font-bold text-ink-900">You&apos;re not enrolled in this course</h1>
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

  return (
    <div className="space-y-6">
      <header className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href={`/courses/${course.slug}`} className="text-sm font-semibold text-brand-700 hover:underline">
            Public course page
          </Link>
          <Link href={`/dashboard/courses/${course.slug}/roadmap`} className="text-sm font-semibold text-brand-700 hover:underline">
            Full roadmap
          </Link>
        </div>
        <h1 className="mt-2 font-display text-2xl font-bold text-ink-900">{course.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {course.category} · {course.enrolledCount} learners
        </p>

        {isLearner && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold text-ink-700">Your progress</span>
              <span className="text-slate-500">{progress}%</span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
        {!isLearner && <p className="mt-3 text-sm font-semibold text-ink-700">Mentor / staff view — read only.</p>}
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
        <nav aria-label="Course roadmap" className="order-2 lg:order-1">
          <ol className="space-y-4">
            {course.chapters
              .slice()
              .sort((a, b) => a.order - b.order)
              .map((chapter) => (
                <li key={chapter.id} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-elev1">
                  <p className="font-display font-bold text-ink-900">{chapter.title}</p>
                  {roadmap.chapters
                    .find((c) => c.id === chapter.id)
                    ?.topics.map((topic) => (
                      <div key={topic.id} className="mt-3">
                        <button
                          type="button"
                          onClick={() => void openTopic(topic.id)}
                          className="text-left text-sm font-semibold text-ink-700 hover:text-brand-700"
                        >
                          {topic.title}
                        </button>
                        <ul className="mt-1 space-y-1">
                          {topic.lessons.map((lesson) => {
                            const done = completed.has(lesson.id);
                            const active = selected?.id === lesson.id;
                            return (
                              <li key={lesson.id}>
                                <button
                                  type="button"
                                  onClick={() => setSelected(lesson)}
                                  className={cn(
                                    "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition",
                                    active ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-slate-50",
                                  )}
                                >
                                  <span
                                    aria-hidden
                                    className={cn(
                                      "grid h-4 w-4 shrink-0 place-items-center rounded-full border text-[10px]",
                                      done ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300",
                                    )}
                                  >
                                    {done ? "✓" : ""}
                                  </span>
                                  <span className="truncate">{lesson.title}</span>
                                  <span className="sr-only">{done ? "completed" : "not completed"}</span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    ))}
                </li>
              ))}
            {course.chapters.length === 0 && (
              <li className="rounded-[20px] border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                The roadmap for this course is still being prepared.
              </li>
            )}
          </ol>
        </nav>

        <section className="order-1 lg:order-2">
          {selected ? (
            <article className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {selected.type === "VIDEO" ? "Video lesson" : "Reading"}
              </p>
              <h2 className="mt-1 font-display text-xl font-bold text-ink-900">{selected.title}</h2>

              <div className="mt-4">
                {selected.type === "VIDEO" && selected.contentUrl ? (
                  <a href={selected.contentUrl} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
                    Open video lesson
                  </a>
                ) : selected.textContent ? (
                  <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-700">{selected.textContent}</div>
                ) : selected.contentUrl ? (
                  <a href={selected.contentUrl} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
                    Open resource
                  </a>
                ) : (
                  <p className="text-sm text-slate-500">No content has been added to this lesson yet.</p>
                )}
              </div>

              {isLearner && (
                <div className="mt-6">
                  {completed.has(selected.id) ? (
                    <p className="text-sm font-semibold text-green-700">Completed</p>
                  ) : (
                    <Button onClick={() => void markComplete(selected)} loading={marking}>
                      Mark as complete
                    </Button>
                  )}
                </div>
              )}
            </article>
          ) : (
            <div className="rounded-[20px] border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Select a lesson to begin.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
