"use client";

import { useCallback, useState } from "react";
import { apiGet } from "@/lib/api";
import type { AnalyticsData, AnalyticsTopCourse } from "@/lib/app-types";
import { formatDate, formatMoney } from "@/lib/format";
import ErrorState from "@/components/ui/ErrorState";
import { AdminHeader, Panel, Skeleton, StatusPill, statusTone, useAsync } from "./admin-ui";
import { cn } from "@/lib/cn";

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "12m", label: "12 months" },
] as const;
type Range = (typeof RANGES)[number]["value"];

const isMonthly = (d: string) => /^\d{4}-\d{2}$/.test(d);
const bucketLabel = (d: string) => (isMonthly(d) ? d : formatDate(d, { day: "numeric", month: "short" }));

export default function AdminAnalytics() {
  const [range, setRange] = useState<Range>("30d");
  const fetchData = useCallback(() => apiGet<AnalyticsData>("/admin/analytics", { range }), [range]);
  const { data, error, loading, reload } = useAsync(fetchData, [range]);

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Analytics"
        description="Registrations, enrolments and paid revenue over the selected period. Figures come from live payment and enrolment records."
        actions={
          <div role="group" aria-label="Date range" className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                aria-pressed={range === r.value}
                onClick={() => setRange(r.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                  range === r.value ? "bg-white text-ink-900 shadow-elev1" : "text-slate-600 hover:text-ink-900",
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : loading || !data ? (
        <div className="space-y-4">
          <Skeleton className="h-64 rounded-[20px]" />
          <Skeleton className="h-64 rounded-[20px]" />
        </div>
      ) : (
        <AnalyticsBody data={data} />
      )}
    </div>
  );
}

function AnalyticsBody({ data }: { data: AnalyticsData }) {
  const series = data.series;
  const totals = series.reduce(
    (acc, p) => ({
      revenuePaise: acc.revenuePaise + p.revenuePaise,
      newUsers: acc.newUsers + p.newUsers,
      enrollments: acc.enrollments + p.enrollments,
    }),
    { revenuePaise: 0, newUsers: 0, enrollments: 0 },
  );
  const empty = totals.revenuePaise === 0 && totals.newUsers === 0 && totals.enrollments === 0;

  return (
    <div className="space-y-6">
      {empty && (
        <p className="rounded-[20px] border border-dashed border-slate-300 bg-white px-5 py-4 text-sm text-slate-500">
          No registrations, enrolments or paid orders were recorded in this period. This is a genuine zero, not missing data.
        </p>
      )}

      <SeriesChart
        title="Paid revenue"
        summary={`Total ${formatMoney(totals.revenuePaise)} over ${series.length} buckets.`}
        points={series.map((p) => ({ label: p.date, value: p.revenuePaise }))}
        formatValue={(v) => formatMoney(v)}
      />
      <SeriesChart
        title="New registrations"
        summary={`${totals.newUsers} new accounts over ${series.length} buckets.`}
        points={series.map((p) => ({ label: p.date, value: p.newUsers }))}
        formatValue={(v) => `${v}`}
      />
      <SeriesChart
        title="New enrolments"
        summary={`${totals.enrollments} learner enrolments over ${series.length} buckets.`}
        points={series.map((p) => ({ label: p.date, value: p.enrollments }))}
        formatValue={(v) => `${v}`}
      />

      <TopCourses courses={data.topCourses} />
    </div>
  );
}

function SeriesChart({
  title,
  summary,
  points,
  formatValue,
}: {
  title: string;
  summary: string;
  points: { label: string; value: number }[];
  formatValue: (v: number) => string;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const peak = points.reduce((a, b) => (b.value > a.value ? b : a), points[0] ?? { label: "", value: 0 });

  return (
    <Panel title={title} description={summary}>
      {points.length === 0 ? (
        <p className="text-sm text-slate-500">No buckets returned for this range.</p>
      ) : (
        <>
          <div className="overflow-x-auto pb-2" aria-hidden>
            <div className="flex h-40 min-w-full items-end gap-1">
              {points.map((p, i) => (
                <div
                  key={`${p.label}-${i}`}
                  title={`${p.label}: ${formatValue(p.value)}`}
                  className="flex h-full min-w-[6px] flex-1 flex-col justify-end"
                >
                  <div
                    className="w-full rounded-t bg-brand-600"
                    style={{ height: `${Math.max(p.value > 0 ? 2 : 0, (p.value / max) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-1 flex min-w-full justify-between text-[11px] text-slate-400">
              <span>{bucketLabel(points[0].label)}</span>
              <span>{bucketLabel(points[points.length - 1].label)}</span>
            </div>
          </div>

          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-semibold text-brand-700">View data table</summary>
            <div className="mt-3 max-h-64 overflow-auto">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">{title} by bucket</caption>
                <thead className="sticky top-0 bg-white text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="py-2 pr-4 font-semibold">Bucket</th>
                    <th scope="col" className="py-2 font-semibold">{title}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {points.map((p, i) => (
                    <tr key={`${p.label}-${i}`}>
                      <th scope="row" className="py-1.5 pr-4 font-normal text-slate-600">{bucketLabel(p.label)}</th>
                      <td className="py-1.5 text-ink-900">{formatValue(p.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          {peak.value > 0 && (
            <p className="mt-2 text-xs text-slate-500">
              Peak {formatValue(peak.value)} on {bucketLabel(peak.label)}.
            </p>
          )}
        </>
      )}
    </Panel>
  );
}

function TopCourses({ courses }: { courses: AnalyticsTopCourse[] }) {
  return (
    <Panel title="Most-enrolled courses" description="Non-draft courses ranked by active learners.">
      {courses.length === 0 ? (
        <p className="text-sm text-slate-500">No courses to rank yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="py-2 pr-4 font-semibold">Course</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Status</th>
                <th scope="col" className="py-2 pr-4 font-semibold">Price</th>
                <th scope="col" className="py-2 font-semibold">Active learners</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {courses.map((c) => (
                <tr key={c.id}>
                  <th scope="row" className="py-2 pr-4 font-medium text-ink-900">{c.title}</th>
                  <td className="py-2 pr-4">
                    <StatusPill tone={statusTone(c.status)}>{c.status.toLowerCase()}</StatusPill>
                  </td>
                  <td className="py-2 pr-4 text-slate-600">{c.pricePaise > 0 ? formatMoney(c.pricePaise) : "Free"}</td>
                  <td className="py-2 font-semibold text-ink-900">{c.enrolledCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}
