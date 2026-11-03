"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import Link from "next/link";
import type { Application, MyCourses, MentoringRow } from "@/lib/app-types";
import { APPLICATION_STATUS_META } from "@/lib/mentor";
import { formatDate } from "@/lib/format";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { meetingLabel } from "@/components/landing/CourseCardLive";

export default function MentorDashboardView() {
  const [courses, setCourses] = useState<MentoringRow[] | null>(null);
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [mine, appData] = await Promise.all([
        apiGet<MyCourses>("/courses/mine"),
        apiGet<{ applications: Application[] }>("/applications/mine"),
      ]);
      setCourses(mine.mentoring);
      setApps(appData.applications);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your mentor area.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!courses || !apps) return <Spinner label="Loading mentor area…" />;

  const acceptedUnassigned = apps.filter(
    (a) => a.status === "ACCEPTED" && !courses.some((c) => c.course.id === a.course.id),
  );

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <header className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-900">Mentor</h1>
          <p className="mt-1 text-sm text-slate-600">Assignments and application follow-up, in one place.</p>
        </div>
        <Link
          href="/dashboard/mentor/apply"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 bg-paper px-4 py-2 text-sm font-semibold text-ink-700 transition hover:border-brand-500 hover:text-brand-800"
        >
          Find a course to teach
        </Link>
      </header>

      <section aria-labelledby="teaching-h">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="teaching-h" className="font-display text-lg font-semibold text-ink-900">Current assignments</h2>
          <p className="text-xs text-slate-500">{courses.length} assigned course{courses.length === 1 ? "" : "s"}</p>
        </div>
        {courses.length === 0 ? (
          <div>
            <EmptyState
              title="No teaching assignments"
              description="You are not assigned to teach any course yet. Accepted mentors appear here once assigned. Apply from a course page."
            />
          </div>
        ) : (
          <ul className="divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 bg-paper">
            {courses.map((c) => (
              <li key={c.id} className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-display text-base font-semibold text-ink-900">{c.course.title}</h3>
                    {c.course.status !== "PUBLISHED" && (
                      <span className="rounded bg-amber-50 px-2 py-1 text-[11px] font-semibold capitalize text-amber-900">
                        {c.course.status.toLowerCase()}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{c.course.category}</p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-5 gap-y-2 sm:grid-cols-3">
                    <div>
                      <dt className="text-xs font-semibold text-slate-600">Learners</dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-ink-900">{c.course._count?.participants ?? 0}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-slate-600">Lessons live</dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-ink-900">{c.lessonsPublished ?? 0}/{c.lessonsTotal ?? 0}</dd>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <dt className="text-xs font-semibold text-slate-600">Next meeting</dt>
                      <dd className="mt-0.5 text-sm font-semibold text-ink-900">{c.nextMeetingAt ? meetingLabel(c.nextMeetingAt) : "Not scheduled"}</dd>
                    </div>
                  </dl>
                </div>
                <Link
                  href={`/dashboard/mentor/courses/${c.course.slug}`}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
                >
                  Open workspace
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {acceptedUnassigned.map((a) => (
        <p key={a.id} role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>{a.course.title}</strong>. Your application was accepted, but a teaching assignment is not active yet. Your workspace will appear once assigned.
        </p>
      ))}

      <section aria-labelledby="apps-h">
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="apps-h" className="font-display text-lg font-semibold text-ink-900">Application tracking</h2>
          <p className="text-xs text-slate-500">{apps.length} application{apps.length === 1 ? "" : "s"}</p>
        </div>
        {apps.length === 0 ? (
          <div>
            <EmptyState
              title="No applications yet"
              description="Apply to teach a course and track its review status here."
            />
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-slate-200 rounded-lg border border-slate-200 bg-paper">
            {apps.map((a) => {
              const meta = APPLICATION_STATUS_META[a.status];
              return (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900">{a.course.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Applied {formatDate(a.createdAt, { dateStyle: "medium" })} ·{" "}
                      <span className={meta.tone}>{meta.label}</span>
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/mentor/applications/${a.id}`}
                    className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-brand-800 transition hover:bg-brand-50"
                  >
                    Review status
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
