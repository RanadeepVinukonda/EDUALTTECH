"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { Application, MyCourses, MentoringRow } from "@/lib/app-types";
import { APPLICATION_STATUS_META } from "@/lib/mentor";
import { formatDate } from "@/lib/format";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/Button";

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
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Mentor</h1>
          <p className="mt-1 text-sm text-slate-500">Your teaching assignments and applications.</p>
        </div>
        <Link href="/dashboard/mentor/apply" className={buttonClass("primary", "sm")}>
          New application
        </Link>
      </header>

      <section aria-labelledby="teaching-h">
        <h2 id="teaching-h" className="font-display text-lg font-bold text-ink-900">
          Teaching
        </h2>
        {courses.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="No teaching assignments"
              description="You are not assigned to teach any course yet. Accepted mentors appear here once assigned."
              action={
                <Link href="/dashboard/mentor/apply" className={buttonClass("secondary", "sm")}>
                  Apply to mentor
                </Link>
              }
            />
          </div>
        ) : (
          <ul className="mt-3 grid gap-4 sm:grid-cols-2">
            {courses.map((c) => (
              <li key={c.id} className="rounded-[20px] border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{c.course.category}</p>
                <p className="mt-1 font-display text-lg font-bold text-ink-900">{c.course.title}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {c.course._count?.participants ?? 0} learners
                  {c.course.status !== "PUBLISHED" && ` · ${c.course.status.toLowerCase()}`}
                </p>
                <Link
                  href={`/dashboard/mentor/courses/${c.course.slug}`}
                  className={buttonClass("secondary", "sm", "mt-4")}
                >
                  Open workspace
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {acceptedUnassigned.map((a) => (
        <p key={a.id} role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You were accepted for <strong>{a.course.title}</strong>, but no teaching assignment is active yet.
          Your workspace will appear once assigned.
        </p>
      ))}

      <section aria-labelledby="apps-h">
        <h2 id="apps-h" className="font-display text-lg font-bold text-ink-900">
          Your applications
        </h2>
        {apps.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="No applications yet"
              description="Apply to teach a course and track its review status here."
            />
          </div>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-slate-200 rounded-[20px] border border-slate-200 bg-white">
            {apps.map((a) => {
              const meta = APPLICATION_STATUS_META[a.status];
              return (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900">{a.course.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Applied {formatDate(a.createdAt, { dateStyle: "medium" })} ·{" "}
                      <span className={meta.tone}>{meta.label}</span>
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/mentor/applications/${a.id}`}
                    className={buttonClass("ghost", "sm")}
                  >
                    View application
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
