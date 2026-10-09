"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { MyCourses, Roadmap } from "@/lib/app-types";
import { buttonClass } from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import CoverImage from "@/components/ui/CoverImage";

interface CourseProgress {
  id: string;
  slug: string;
  title: string;
  thumbnailUrl: string | null;
  category: string;
  progressPct: number;
  totalLessons: number | null;
  completedLessons: number | null;
}

export default function ProgressView() {
  const [rows, setRows] = useState<CourseProgress[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const mine = await apiGet<MyCourses>("/courses/mine");
      // Server reports progressPct; lesson counts come from each authoritative roadmap.
      // A roadmap failure degrades to progress-only rather than erasing the row.
      const results = await Promise.all(
        mine.learning.map(async (row): Promise<CourseProgress> => {
          const base: CourseProgress = {
            id: row.id,
            slug: row.course.slug,
            title: row.course.title,
            thumbnailUrl: row.course.thumbnailUrl,
            category: row.course.category,
            progressPct: row.progressPct,
            totalLessons: null,
            completedLessons: null,
          };
          try {
            const rm = await apiGet<Roadmap>(`/courses/${row.course.id}/roadmap`);
            const total = rm.chapters.flatMap((c) => c.topics.flatMap((t) => t.lessons)).length;
            return { ...base, totalLessons: total, completedLessons: rm.completedLessonIds.length };
          } catch {
            return base;
          }
        }),
      );
      setRows(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your progress.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!rows) return <Spinner label="Loading your progress…" />;

  const completedCourses = rows.filter((r) => r.totalLessons !== null && r.totalLessons > 0 && r.completedLessons === r.totalLessons).length;
  const activeCourses = rows.length - completedCourses;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink-900">Progress</h1>
        <p className="mt-1 text-[15px] text-slate-500">Your learning across enrolled courses.</p>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          title="No enrolled courses yet"
          description="Once you enroll, your progress appears here."
          action={
            <Link href="/courses" className={buttonClass("primary", "sm")}>
              Browse courses
            </Link>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Summary label="Enrolled courses" value={rows.length} />
            <Summary label="In progress" value={activeCourses} />
            <Summary label="Completed" value={completedCourses} />
          </div>

          <ul className="space-y-4">
            {rows.map((r) => {
              const complete = r.totalLessons !== null && r.totalLessons > 0 && r.completedLessons === r.totalLessons;
              return (
                <li key={r.id} className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-elev1">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 gap-4">
                      <CoverImage src={r.thumbnailUrl} alt="" fallback={r.title} className="h-16 w-24 shrink-0 rounded-xl" />
                      <div className="min-w-0">
                        <h2 className="truncate font-display font-bold text-ink-900">{r.title}</h2>
                        <p className="mt-0.5 text-xs text-slate-500">{r.category}</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {r.totalLessons === null
                            ? `${r.progressPct}% complete`
                            : `${r.completedLessons} of ${r.totalLessons} lessons complete`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill complete={complete} />
                      <Link href={`/dashboard/courses/${r.slug}/roadmap`} className={buttonClass("secondary", "sm")}>
                        {complete ? "Review" : "Continue"}
                      </Link>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${r.progressPct}% complete`}>
                      <div className="h-full rounded-full bg-brand-600" style={{ width: `${r.progressPct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{r.progressPct}% complete</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-elev1">
      <p className="font-display text-3xl font-bold text-ink-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function StatusPill({ complete }: { complete: boolean }) {
  return (
    <span
      className={
        complete
          ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800"
          : "rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700"
      }
    >
      {complete ? "Completed" : "In progress"}
    </span>
  );
}
