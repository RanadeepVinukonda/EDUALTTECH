"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiPost } from "@/lib/api";
import { fetchPrivateUrl } from "@/lib/upload";
import { describeError } from "@/lib/errors";
import { useCourseRoadmap } from "./useCourseRoadmap";
import { notifyError, notifySuccess } from "@/lib/notify";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import AccessDenied from "@/components/ui/AccessDenied";
import Button, { buttonClass } from "@/components/ui/Button";
import MarkdownArticleViewer from "@/components/ui/MarkdownArticleViewer";
import type { LessonRow, TopicRow, ChapterRow } from "@/lib/app-types";

interface Entry {
  lesson: LessonRow;
  topic: TopicRow;
  chapter: ChapterRow;
}

function LessonSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading lesson…</span>
      <div aria-hidden>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-4 w-2/5" />
        <Skeleton className="mt-3 h-8 w-3/4" />
        <Skeleton className="mt-2 h-4 w-1/4" />
      </div>
      <div className="rounded-xl border border-rule bg-paper p-6" aria-hidden>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-3 h-4 w-11/12" />
        <Skeleton className="mt-3 h-4 w-10/12" />
        <Skeleton className="mt-3 h-4 w-9/12" />
      </div>
    </div>
  );
}

export default function LessonViewer({ slug, lessonId }: { slug: string; lessonId: string }) {
  const { detail, roadmap, completed, loading, error, code, reload } = useCourseRoadmap(slug);
  const [marking, setMarking] = useState(false);

  const flat = useMemo(() => (roadmap?.chapters ?? []).flatMap((c) => c.topics.flatMap((t) => t.lessons)), [roadmap]);

  const entry = useMemo<Entry | null>(() => {
    for (const chapter of roadmap?.chapters ?? []) {
      for (const topic of chapter.topics) {
        for (const lesson of topic.lessons) {
          if (lesson.id === lessonId) return { lesson, topic, chapter };
        }
      }
    }
    return null;
  }, [roadmap, lessonId]);

  const index = flat.findIndex((l) => l.id === lessonId);
  const prev = index > 0 ? flat[index - 1] : null;
  const next = index >= 0 && index < flat.length - 1 ? flat[index + 1] : null;

  const lockedLesson = entry?.lesson ?? null;
  const locked = Boolean(lockedLesson && !lockedLesson.isPublished && detail && !detail.access.isStaff);
  const wantVideo = Boolean(lockedLesson && lockedLesson.type === "VIDEO" && lockedLesson.hasVideo && !locked);

  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  useEffect(() => {
    setVideoUrl(null);
    if (!lockedLesson || !wantVideo) return;
    let alive = true;
    fetchPrivateUrl(`/courses/lessons/${lockedLesson.id}/video`)
      .then((u) => {
        if (alive) setVideoUrl(u);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [lockedLesson, wantVideo]);

  if (loading) return <LessonSkeleton />;
  if (error) {
    if (code === "FORBIDDEN" || code === "UNAUTHORIZED") {
      return (
        <AccessDenied
          title="You don’t have access to this course"
          description="Only enrolled learners and course staff can view its lessons."
        />
      );
    }
    return <ErrorState message={error} onRetry={() => void reload()} />;
  }
  if (!detail) return <ErrorState title="Course not found" message="This course could not be loaded." />;
  if (!roadmap) {
    return (
      <AccessDenied
        title="Lesson content is locked"
        description="You need access to this course to view its lessons."
      />
    );
  }
  if (!entry) {
    return (
      <div className="space-y-4">
        <ErrorState title="Lesson not found" message="This lesson doesn't exist or isn't available to you." />
        <div className="flex justify-center">
          <Link href={`/dashboard/courses/${slug}/roadmap`} className={buttonClass("secondary", "sm")}>
            Back to roadmap
          </Link>
        </div>
      </div>
    );
  }

  const { lesson, topic, chapter } = entry;
  const isLearner = detail.myParticipation?.role === "LEARNER";
  const done = completed.has(lesson.id);

  if (!lesson.isPublished && !detail.access.isStaff) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href={`/dashboard/courses/${slug}/roadmap`} className="text-sm font-semibold text-brand-700 hover:underline">
          Back to roadmap
        </Link>
        <div className="grid place-items-center border-y border-rule bg-paper-2 px-5 py-12 text-center sm:px-10">
          <h1 className="mt-3 font-display text-xl font-semibold text-ink-900">This lesson is locked</h1>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            Your mentor will make each lesson available when its video or live class is ready. Check back soon.
          </p>
          <Link href={`/dashboard/courses/${slug}/roadmap`} className={buttonClass("secondary", "sm", "mt-4")}>
            Back to roadmap
          </Link>
        </div>
      </div>
    );
  }

  async function markComplete() {
    if (marking || done) return;
    setMarking(true);
    try {
      await apiPost(`/courses/lessons/${lesson.id}/complete`);
      await reload(); // authoritative re-fetch of progress
      notifySuccess("Lesson marked complete.");
    } catch (err) {
      notifyError(describeError(err, "Could not save your progress."));
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-3">
      <header className="border-b border-rule pb-5">
        <Link href={`/dashboard/courses/${slug}/roadmap`} className="inline-flex min-h-11 items-center text-sm font-semibold text-accent hover:underline">
          Course roadmap
        </Link>
        <p className="mt-3 flex flex-wrap items-center text-sm text-muted">
          <span>{chapter.title}</span>
          <span className="mx-2" aria-hidden>/</span>
          <span>{topic.title}</span>
        </p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{lesson.title}</h1>
          <p className="flex shrink-0 items-center gap-2 text-sm text-muted">
            {lesson.type === "VIDEO" ? "Video lesson" : "Reading"}
            {done && <span className="font-semibold text-accent">Completed</span>}
          </p>
        </div>
      </header>

      <article className="border-y border-rule bg-paper px-4 py-6 sm:px-8 sm:py-9">
        {lesson.type === "VIDEO" ? (
          lesson.hasVideo ? (
            videoUrl ? (
              <video
                controls
                preload="metadata"
                poster={detail.course.thumbnailUrl ?? "/media/photos/EAT3.jpg"}
                className="w-full rounded-xl bg-black"
                src={videoUrl}
              />
            ) : (
              <p className="text-sm text-slate-500">Loading video…</p>
            )
          ) : lesson.contentUrl ? (
            <div className="space-y-3">
              <a href={lesson.contentUrl} target="_blank" rel="noreferrer" className={buttonClass("primary", "sm")}>
                Open video lesson
              </a>
              <p className="text-xs text-slate-500">
                Opens the course&apos;s video in a new tab. Captions and transcripts are shown where the source provides them.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No video has been added to this lesson yet.</p>
          )
        ) : lesson.textContent ? (
          <MarkdownArticleViewer content={lesson.textContent} />
        ) : (
          <p className="text-sm text-slate-500">No content has been added to this lesson yet.</p>
        )}

        {lesson.resourceArticle && (
          <div className="mt-8 flex flex-col gap-3 border-t border-rule pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-display text-sm font-semibold text-ink-900 sm:text-base">
                {lesson.resourceArticle.title}
              </h3>
              <p className="mt-1 flex flex-wrap gap-x-3 text-sm text-slate-600">
                <span>{lesson.resourceArticle.difficulty}</span>
                <span>About {lesson.resourceArticle.estimatedMinutes} minutes to read</span>
              </p>
            </div>
            <Link
              href={`/resources/${lesson.resourceArticle.slug}`}
              target="_blank"
              className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-rule px-4 py-2 text-xs font-semibold text-ink transition hover:bg-paper-2"
            >
              Read guide
            </Link>
          </div>
        )}
      </article>

      {isLearner && (
        <div className="flex items-center gap-3">
          {done ? (
            <p className="text-sm font-semibold text-green-700">You&apos;ve completed this lesson.</p>
          ) : (
            <Button onClick={() => void markComplete()} loading={marking} disabled={marking}>
              Mark as complete
            </Button>
          )}
        </div>
      )}

      <nav aria-label="Lesson navigation" className="sticky bottom-16 z-20 -mx-4 flex items-center justify-between gap-3 border-t border-rule bg-paper/95 px-4 py-3 backdrop-blur sm:bottom-0 sm:-mx-6 sm:px-6">
        {prev ? (
          <Link href={`/dashboard/courses/${slug}/lessons/${prev.id}`} className={buttonClass("secondary", "sm", "min-h-11")}>
            Previous lesson
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/dashboard/courses/${slug}/lessons/${next.id}`} className={buttonClass("primary", "sm", "min-h-11")}>
            Next lesson
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
