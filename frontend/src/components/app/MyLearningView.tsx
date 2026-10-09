"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { MyCourses } from "@/lib/app-types";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import CoverImage from "@/components/ui/CoverImage";

type Tab = "learning" | "mentoring";

export default function MyLearningView() {
  const [data, setData] = useState<MyCourses | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("learning");

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await apiGet<MyCourses>("/courses/mine"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your courses.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return <Spinner label="Loading your courses…" />;

  const counts = { learning: data.learning.length, mentoring: data.mentoring.length };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink-900">My Learning</h1>
        <p className="mt-1 text-[15px] text-slate-500">Everything you&apos;re enrolled in or mentoring.</p>
      </header>

      <div role="tablist" aria-label="Course roles" className="flex gap-2">
        {(["learning", "mentoring"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              tab === t ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700 hover:bg-slate-200",
            )}
          >
            {t === "learning" ? "Learning" : "Mentoring"} ({counts[t]})
          </button>
        ))}
      </div>

      {tab === "learning" ? (
        data.learning.length === 0 ? (
          <EmptyState
            title="Not enrolled in any course yet"
            description="Browse the catalogue and start with a free course."
            action={
              <Link href="/courses" className={buttonClass("primary", "sm")}>
                Browse courses
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.learning.map((row) => (
              <article key={row.id} className="flex flex-col gap-4 rounded-[20px] border border-slate-200 bg-white p-4 shadow-elev1">
                <div className="flex gap-4">
                  <CoverImage src={row.course.thumbnailUrl} alt="" fallback={row.course.title} className="h-20 w-28 shrink-0 rounded-xl" />
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-display font-bold text-ink-900">{row.course.title}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{row.course.category}</p>
                    {row.mentor ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Mentor: {row.mentor.firstName} {row.mentor.lastName}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-slate-400">Mentor not assigned yet</p>
                    )}
                  </div>
                </div>
                <div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-600" style={{ width: `${row.progressPct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{row.progressPct}% complete</p>
                </div>
                <Link href={`/dashboard/courses/${row.course.slug}`} className={buttonClass("primary", "sm", "self-start")}>
                  {row.progressPct > 0 ? "Continue" : "Start learning"}
                </Link>
              </article>
            ))}
          </div>
        )
      ) : data.mentoring.length === 0 ? (
        <EmptyState title="You're not mentoring any course" description="Once you're accepted as a mentor, your courses appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.mentoring.map((row) => (
            <article key={row.id} className="flex flex-col gap-4 rounded-[20px] border border-slate-200 bg-white p-4 shadow-elev1">
              <div className="flex gap-4">
                <CoverImage src={row.course.thumbnailUrl} alt="" fallback={row.course.title} className="h-20 w-28 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-display font-bold text-ink-900">{row.course.title}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">{row.course.category}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {row.course.status.replace(/_/g, " ").toLowerCase()}
                  </p>
                </div>
              </div>
              <Link href={`/dashboard/courses/${row.course.slug}`} className={buttonClass("secondary", "sm", "self-start")}>
                Open course
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
