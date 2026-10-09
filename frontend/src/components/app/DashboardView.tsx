"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import { describeError } from "@/lib/errors";
import { useAuth } from "./AuthProvider";
import type { DashboardData } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import CoverImage from "@/components/ui/CoverImage";
import { buttonClass } from "@/components/ui/Button";

function Stat({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <>
      <p className="font-display text-3xl font-bold text-ink-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </>
  );
  const cls = "rounded-[20px] border border-slate-200 bg-white p-5 shadow-elev1";
  return href ? (
    <Link href={href} className={`${cls} transition hover:border-brand-300`}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-live="polite">
      <span className="sr-only">Loading your dashboard…</span>
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-5 w-48" />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-elev1">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="mt-2 h-4 w-28" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2" aria-hidden>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-[20px] border border-slate-200 bg-white p-4 shadow-elev1">
            <Skeleton className="h-20 w-28 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="mt-3 h-1.5 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardView() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await apiGet<DashboardData>("/dashboard"));
    } catch (err) {
      setError(describeError(err, "Could not load your dashboard."));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return <DashboardSkeleton />;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink-900">Welcome back, {user?.firstName}</h1>
        <p className="mt-1 text-[15px] text-slate-500">Here&apos;s what&apos;s happening in your learning.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Courses you're learning" value={data.learning.length} href="/dashboard/my-learning" />
        <Stat label="Mentoring" value={data.mentoring.length} />
        <Stat label="Unread notifications" value={data.unreadNotifications} />
        <Stat label="Unread messages" value={data.unreadMessages} />
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-ink-900">Continue learning</h2>
          <Link href="/dashboard/my-learning" className="text-sm font-semibold text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        {data.learning.length === 0 ? (
          <EmptyState
            title="No courses yet"
            description="Browse the catalogue and enroll to start learning."
            action={
              <Link href="/courses" className={buttonClass("primary", "sm")}>
                Browse courses
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.learning.slice(0, 4).map((row) => (
              <Link
                key={row.id}
                href={`/dashboard/courses/${row.course.slug}`}
                className="group flex gap-4 rounded-[20px] border border-slate-200 bg-white p-4 shadow-elev1 transition hover:border-brand-300"
              >
                <CoverImage src={row.course.thumbnailUrl} alt="" fallback={row.course.title} className="h-20 w-28 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display font-bold text-ink-900 group-hover:text-brand-700">{row.course.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{row.course.category}</p>
                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-600" style={{ width: `${row.progressPct}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{row.progressPct}% complete</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold text-ink-900">Upcoming live sessions</h2>
        {data.upcomingMeetings.length === 0 ? (
          <EmptyState title="No sessions scheduled" description="Live sessions for your courses will appear here." />
        ) : (
          <ul className="space-y-3">
            {data.upcomingMeetings.map((m) => (
              <li key={m.id} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-elev1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink-900">{m.title}</p>
                    <p className="text-sm text-slate-500">
                      {m.course.title} · {formatDate(m.scheduledAt)} · {m.durationMin} min
                    </p>
                  </div>
                  <a href={m.meetingUrl} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
                    Join session
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {data.applications.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-bold text-ink-900">Mentor applications</h2>
          <ul className="divide-y divide-slate-100 rounded-[20px] border border-slate-200 bg-white shadow-elev1">
            {data.applications.map((a) => (
              <li key={a.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="font-semibold text-ink-900">{a.course.title}</p>
                  <p className="text-xs text-slate-500">Applied {formatDate(a.createdAt)}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-ink-700">
                  {a.status.replace(/_/g, " ").toLowerCase()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
