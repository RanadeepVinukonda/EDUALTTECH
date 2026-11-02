"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { describeError } from "@/lib/errors";
import { useAuth } from "./AuthProvider";
import type { DashboardData } from "@/lib/app-types";
import { formatDate, formatCountdown } from "@/lib/format";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import CourseCard from "@/components/landing/CourseCard";
import type { CourseListItem } from "@/lib/types";
import { buttonClass } from "@/components/ui/Button";
import ProgressView from "./ProgressView";
import Spinner from "@/components/ui/Spinner";

function DashboardSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-live="polite">
      <span className="sr-only">Loading your dashboard…</span>
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-5 w-48" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2" aria-hidden>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
            <Skeleton className="h-20 w-28 shrink-0 rounded-lg" />
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
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [discover, setDiscover] = useState<CourseListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setError(null);
    try {
      const [d, catalog] = await Promise.all([
        apiGet<DashboardData>("/dashboard"),
        apiGet<{ items: CourseListItem[] }>("/courses", { limit: 12, sort: "newest" }).catch(() => null),
      ]);
      setData(d);
      setDiscover(catalog?.items ?? []);
    } catch (err) {
      setError(describeError(err, "Could not load your dashboard."));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Ticks the live countdown for upcoming sessions — every second only when one is imminent.
  useEffect(() => {
    const list = data?.upcomingMeetings ?? [];
    if (list.length === 0) return;
    const windows = list.map((m) => {
      const start = new Date(m.scheduledAt).getTime();
      return { start, end: start + m.durationMin * 60_000 };
    });
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const tickNow = Date.now();
      setNow(tickNow);
      const next = windows.filter((w) => w.end > tickNow).sort((a, b) => a.start - b.start)[0];
      if (!next) return;
      timer = setTimeout(tick, next.start - tickNow <= 3_600_000 ? 1000 : 60_000);
    };
    timer = setTimeout(tick, 1000);
    return () => clearTimeout(timer);
  }, [data]);

  // Admins have their own home; the learner dashboard is not theirs.
  useEffect(() => {
    if (user?.role === "ADMIN") router.replace("/dashboard/admin");
  }, [user, router]);

  if (user?.role === "ADMIN") {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Spinner label="Redirecting to Admin Dashboard..." />
      </div>
    );
  }
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return <DashboardSkeleton />;

  const current = data.learning[0];
  const upcoming = data.upcomingMeetings[0];
  const explore = (discover ?? []).slice(0, 4);
  const unread = data.unreadNotifications + data.unreadMessages;

  return (
    <div className="space-y-10">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {data.learning.length > 0
              ? `${data.learning.length} active ${data.learning.length === 1 ? "course" : "courses"}${unread > 0 ? ` · ${unread} unread` : ""}`
              : "Pick a course to get started."}
          </p>
        </div>
        {current ? (
          <Link
            href={`/dashboard/courses/${current.course.slug}`}
            className={buttonClass("primary", "md", "max-w-full")}
          >
            <span className="truncate">Continue {current.course.title}</span>
          </Link>
        ) : (
          <Link href="/dashboard/courses" className={buttonClass("primary", "md")}>
            Browse courses
          </Link>
        )}
      </header>

      {upcoming && (
        <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Next live session</p>
            <p className="mt-1 font-display text-lg font-semibold text-ink-900">{upcoming.title}</p>
            <p className="mt-0.5 text-sm text-slate-600">
              {upcoming.course.title} · {formatDate(upcoming.scheduledAt)} · {upcoming.durationMin} min
            </p>
            {new Date(upcoming.scheduledAt).getTime() > now && (
              <p className="mt-1 text-sm font-medium text-brand-700">
                Starts in {formatCountdown(new Date(upcoming.scheduledAt).getTime() - now)}
              </p>
            )}
          </div>
          <a href={upcoming.meetingUrl} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
            Join session
          </a>
        </section>
      )}

      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-900">Continue learning</h2>
            <p className="mt-0.5 text-sm text-slate-500">Your active courses and current progress.</p>
          </div>
          <Link href="/dashboard/my-learning" className="text-sm font-medium text-slate-600 hover:text-ink-900">
            View all
          </Link>
        </div>
        {data.learning.length === 0 ? (
          <EmptyState
            title="No courses yet"
            description="Browse the catalogue and enroll to start learning."
            action={
              <Link href="/dashboard/courses" className={buttonClass("primary", "sm")}>
                Browse courses
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.learning.slice(0, 4).map((row) => (
              <CourseCard
                key={row.id}
                course={row.course}
                href={`/dashboard/courses/${row.course.slug}`}
                priceLabel="Enrolled"
                progressPct={row.progressPct}
                mentor={row.mentor ? `${row.mentor.firstName} ${row.mentor.lastName}` : undefined}
                viewLabel={row.progressPct > 0 ? "Continue" : "Start learning"}
              />
            ))}
          </div>
        )}
      </section>

      {data.upcomingMeetings.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl font-semibold text-ink-900">Upcoming sessions</h2>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {data.upcomingMeetings.slice(0, 5).map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{m.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {m.course.title} · {formatDate(m.scheduledAt)} · {m.durationMin} min
                  </p>
                </div>
                <a href={m.meetingUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-ink-700 hover:text-brand-700">
                  Join
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {explore.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink-900">Explore courses</h2>
              <p className="mt-0.5 text-sm text-slate-500">New additions to the catalogue.</p>
            </div>
            <Link href="/dashboard/courses" className="text-sm font-medium text-slate-600 hover:text-ink-900">
              View all
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {explore.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="progress-h">
        <h2 id="progress-h" className="mb-4 font-display text-xl font-semibold text-ink-900">
          Your progress
        </h2>
        <ProgressView compact />
      </section>

      {data.applications.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl font-semibold text-ink-900">Mentor applications</h2>
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            {data.applications.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-semibold text-ink-900">{a.course.title}</p>
                  <p className="mt-0.5 text-xs text-slate-500">Applied {formatDate(a.createdAt)}</p>
                </div>
                <span className="text-xs font-medium capitalize text-slate-600">
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
