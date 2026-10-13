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
import Lock from "@mui/icons-material/Lock";
import type { LessonRow, TopicRow, ChapterRow } from "@/lib/app-types";

interface Entry {
  lesson: LessonRow;
  topic: TopicRow;
  chapter: ChapterRow;
}

function LessonSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-6" role="status" aria-live="polite">
      <span className="sr-only">Loading lesson…</span>
      <div aria-hidden>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-4 w-2/5" />
        <Skeleton className="mt-3 h-8 w-3/4" />
        <Skeleton className="mt-2 h-4 w-1/4" />
      </div>
      <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1" aria-hidden>
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
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href={`/dashboard/courses/${slug}/roadmap`} className="text-sm font-semibold text-brand-700 hover:underline">
          ← Back to roadmap
        </Link>
        <div className="grid place-items-center rounded-[20px] border border-slate-200 bg-white p-10 text-center shadow-elev1">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
            <Lock aria-hidden />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold text-ink-900">This lesson is locked</h1>
          <p className="mt-1 max-w-md text-sm text-slate-500">
            Your mentor unlocks each lesson once its video or live class is ready. Check back soon.
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
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link href={`/dashboard/courses/${slug}/roadmap`} className="text-sm font-semibold text-brand-700 hover:underline">
          ← Back to roadmap
        </Link>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {chapter.title} · {topic.title}
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-ink-900">{lesson.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {lesson.type === "VIDEO" ? "Video lesson" : "Reading"}
          {done && <span className="ml-2 font-semibold text-green-700">· Completed</span>}
        </p>
      </div>

      <article className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1">
        {lesson.type === "VIDEO" ? (
          lesson.hasVideo ? (
            videoUrl ? (
              <video controls className="w-full rounded-xl bg-black" src={videoUrl} />
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
          <div className="whitespace-pre-wrap text-[16px] leading-relaxed text-ink-800">{lesson.textContent}</div>
        ) : (
          <p className="text-sm text-slate-500">No content has been added to this lesson yet.</p>
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

      <nav aria-label="Lesson navigation" className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        {prev ? (
          <Link href={`/dashboard/courses/${slug}/lessons/${prev.id}`} className={buttonClass("secondary", "sm")}>
            ← Previous
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/dashboard/courses/${slug}/lessons/${next.id}`} className={buttonClass("secondary", "sm")}>
            Next →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
