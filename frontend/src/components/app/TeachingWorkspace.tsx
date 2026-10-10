"use client";

import { useState } from "react";
import Link from "next/link";
import { useCourseRoadmap } from "./useCourseRoadmap";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import LessonManager from "./LessonManager";
import MeetingManager from "./MeetingManager";
import LearnerRoster from "./LearnerRoster";
import { buttonClass } from "@/components/ui/Button";

type Tab = "overview" | "learners" | "curriculum" | "meetings";

export default function TeachingWorkspace({ slug }: { slug: string }) {
  const { detail, roadmap, loading, error, reload } = useCourseRoadmap(slug);
  const [tab, setTab] = useState<Tab>("overview");

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

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "learners", label: "Learners" },
    { id: "curriculum", label: "Curriculum" },
    { id: "meetings", label: "Meetings" },
  ];

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

      <div role="tablist" aria-label="Workspace sections" className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-4 py-2.5 text-sm font-semibold transition",
              tab === t.id ? "border-brand-600 text-brand-700" : "border-transparent text-slate-500 hover:text-ink-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="flex flex-col gap-5">
          <dl className="grid gap-4 rounded-[20px] border border-slate-200 bg-white p-5 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-ink-700">Status</dt>
              <dd className="mt-0.5 text-slate-600">{course.status}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-700">Learners</dt>
              <dd className="mt-0.5 text-slate-600">{course.enrolledCount}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-700">Price</dt>
              <dd className="mt-0.5 text-slate-600">{formatPrice(course.pricePaise, course.currency)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-ink-700">Mentors</dt>
              <dd className="mt-0.5 text-slate-600">
                {course.mentors.length > 0
                  ? course.mentors.map((m) => `${m.user.firstName} ${m.user.lastName}`.trim()).join(", ")
                  : "None assigned"}
              </dd>
            </div>
          </dl>
          <p role="note" className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            Course metadata and settings are managed by admins. As a mentor you manage lessons and
            meetings for this course.
          </p>
        </div>
      )}

      {tab === "learners" && <LearnerRoster slug={course.slug} />}

      {tab === "curriculum" && (
        roadmap
          ? <LessonManager roadmap={roadmap} isOwner={isOwner} onChanged={() => void reload()} />
          : <EmptyState title="No roadmap" description="This course has no curriculum yet." />
      )}

      {tab === "meetings" && <MeetingManager courseId={course.id} />}
    </div>
  );
}
