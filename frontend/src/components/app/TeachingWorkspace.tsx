"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCourseRoadmap } from "./useCourseRoadmap";
import { apiGet } from "@/lib/api";
import type { ChatPeer } from "@/lib/app-types";
import { cn } from "@/lib/cn";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import LessonWorkbench from "./LessonWorkbench";
import CourseAnalyticsView from "./CourseAnalytics";
import ChatView from "./ChatView";
import { buttonClass } from "@/components/ui/Button";

export default function TeachingWorkspace({ slug }: { slug: string }) {
  const { detail, roadmap, loading, error, reload } = useCourseRoadmap(slug);
  const [roster, setRoster] = useState<ChatPeer[] | null>(null);

  useEffect(() => {
    let alive = true;
    apiGet<{ learners: { user: ChatPeer }[] }>(`/courses/${slug}/learners`)
      .then((d) => { if (alive) setRoster(d.learners.map((l) => l.user)); })
      .catch(() => { if (alive) setRoster([]); });
    return () => { alive = false; };
  }, [slug]);

  if (loading) return <Spinner label="Loading workspace…" />;
  if (error) return <ErrorState message={error} onRetry={() => void reload()} />;
  if (!detail) return null;

  if (!detail.access.isStaff) {
    return (
      <EmptyState
        title="Not authorized"
        description="You don't have teaching access to this course."
        action={
          <Link href="/dashboard/mentor" className={buttonClass("secondary", "sm")}>
            Back to mentor area
          </Link>
        }
      />
    );
  }

  const course = detail.course;
  const isOwner = detail.access.isCreator || detail.access.isAdmin;

  return (
    <div className="mx-auto flex max-w-[1440px] flex-col gap-6">
      <nav aria-label="Breadcrumb" className="text-xs font-medium text-slate-500">
        <Link href="/dashboard/mentor" className="hover:text-ink-700">
          Mentor
        </Link>
        <span aria-hidden> / </span>
        <span aria-current="page" className="text-ink-800">{course.title}</span>
      </nav>

      <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-900">{course.title}</h1>
          <p className="mt-1 text-sm text-slate-600">{course.category}</p>
        </div>
        <span className="inline-flex w-fit items-center rounded bg-paper-2 px-2.5 py-1 text-xs font-semibold capitalize text-ink-700">
          {course.status.toLowerCase()}
        </span>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <details className="group rounded-lg border border-slate-200 bg-paper">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 sm:px-5">
              <span className="font-display text-lg font-semibold text-ink-900">Student analytics</span>
              <span aria-hidden className="text-slate-400 transition group-open:rotate-180">▾</span>
            </summary>
            <div className="border-t border-slate-200 p-4 sm:p-5">
              <CourseAnalyticsView slug={course.slug} />
            </div>
          </details>

          {roadmap ? (
            <section aria-label="Teaching tasks" className="min-w-0 rounded-lg border border-slate-200 bg-paper">
              <div className="border-b border-slate-200 px-4 py-3 sm:px-5">
                <h2 className="mt-0.5 font-display text-lg font-semibold text-ink-900">Lessons and roadmap</h2>
                <p className="mt-1 text-sm text-slate-600">Review the curriculum and make updates from the lesson controls.</p>
              </div>
              <div className="min-w-0 p-3 sm:p-5">
                <LessonWorkbench courseId={course.id} roadmap={roadmap} isOwner={isOwner} onChanged={() => void reload()} />
              </div>
            </section>
          ) : (
            <EmptyState title="No roadmap" description="This course has no curriculum yet." />
          )}
        </div>

        <aside
          aria-label="Messages"
          className={cn("flex min-w-0 flex-col gap-3 lg:sticky lg:top-6 lg:self-start")}
        >
          <div>
            <h2 className="mt-0.5 font-display text-lg font-semibold text-ink-900">Messages</h2>
          </div>
          <div className="min-w-0 rounded-lg border border-slate-200 bg-paper p-3">
            <ChatView courseId={course.id} title={course.title} compact roster={roster ?? undefined} />
          </div>
        </aside>
      </div>
    </div>
  );
}
