"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { CourseAnalytics } from "@/lib/app-types";
import { describeError } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";

function initials(first: string, last: string): string {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "?";
}

export default function CourseAnalyticsView({ slug }: { slug: string }) {
  const [data, setData] = useState<CourseAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await apiGet<CourseAnalytics>(`/courses/${slug}/analytics`));
    } catch (e) {
      setError(describeError(e, "Could not load analytics."));
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return <Spinner label="Loading analytics…" />;

  const learners = data.learners;
  const avg = learners.length ? Math.round(learners.reduce((s, l) => s + l.progressPct, 0) / learners.length) : 0;
  const completed = learners.filter((l) => l.progressPct >= 100).length;

  return (
    <div className="flex flex-col gap-6">
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Learners", value: learners.length },
          { label: "Avg. progress", value: `${avg}%` },
          { label: "Completed", value: completed },
          { label: "Published lessons", value: data.totalLessons },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{stat.label}</dt>
            <dd className="mt-1 font-display text-2xl font-bold text-ink-900">{stat.value}</dd>
          </div>
        ))}
      </dl>

      {learners.length === 0 ? (
        <EmptyState title="No active learners" description="Analytics will appear once learners enroll." />
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Learner</th>
                <th className="px-4 py-3">Progress</th>
                <th className="px-4 py-3">Lessons</th>
                <th className="px-4 py-3">Last active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {learners.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                        {initials(l.user.firstName, l.user.lastName)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-ink-900">
                          {`${l.user.firstName} ${l.user.lastName}`.trim() || l.user.email}
                        </span>
                        <span className="block truncate text-xs text-slate-500">{l.user.email}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn("h-1.5 w-24 overflow-hidden rounded-full bg-slate-100")}
                        role="progressbar"
                        aria-valuenow={l.progressPct}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${l.user.firstName} progress`}
                      >
                        <span className="block h-full rounded-full bg-brand-600" style={{ width: `${l.progressPct}%` }} />
                      </span>
                      <span className="text-xs font-semibold text-ink-700">{l.progressPct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {l.lessonsCompleted}/{l.totalLessons}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(l.lastActiveAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
