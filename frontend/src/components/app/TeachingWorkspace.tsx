"use client";

import Link from "next/link";
import { useCourseRoadmap } from "./useCourseRoadmap";
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
    <div className="flex flex-col gap-6">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/dashboard/mentor" className="hover:text-ink-700">
          Mentor
        </Link>
        <span aria-hidden> / </span>
        <span className="text-ink-700">{course.title}</span>
      </nav>

      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{course.category}</p>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">{course.title}</h1>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <details className="group rounded-2xl border border-slate-200 bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4">
              <span className="font-display text-lg font-bold text-ink-900">Student analytics</span>
              <span aria-hidden className="text-slate-400 transition group-open:rotate-180">▾</span>
            </summary>
            <div className="border-t border-slate-100 p-5">
              <CourseAnalyticsView slug={course.slug} />
            </div>
          </details>

          {roadmap ? (
            <LessonWorkbench courseId={course.id} roadmap={roadmap} isOwner={isOwner} onChanged={() => void reload()} />
          ) : (
            <EmptyState title="No roadmap" description="This course has no curriculum yet." />
          )}
        </div>

        <aside
          aria-label="Messages"
          className={cn("flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start")}
        >
          <h2 className="font-display text-lg font-bold text-ink-900">Messages</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <ChatView courseId={course.id} title={course.title} compact />
          </div>
        </aside>
      </div>
    </div>
  );
}
