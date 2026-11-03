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
import type { CourseListItem } from "@/lib/types";
import { buttonClass } from "@/components/ui/Button";
import ProgressView from "./ProgressView";
import Spinner from "@/components/ui/Spinner";
import CourseCardLive from "@/components/landing/CourseCardLive";
import CommunityCoursePoll from "@/components/landing/CommunityCoursePoll";

function DashboardSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-live="polite">
      <span className="sr-only">Loading your dashboard…</span>
      <div>
        <Skeleton className="h-9 w-64" />
        <Skeleton className="mt-2 h-5 w-48" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-xl border border-rule bg-paper">
            <Skeleton className="aspect-[16/10] w-full rounded-none" />
            <div className="space-y-3 p-5">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
              <Skeleton className="h-4 w-full" />
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

  const upcoming = data.upcomingMeetings[0];
  const explore = (discover ?? []).slice(0, 4);
  const unread = data.unreadNotifications + data.unreadMessages;

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      <header className="flex flex-col gap-5 border-b border-rule pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-muted">
            {user?.firstName ? `Welcome back, ${user.firstName}. ` : ""}
            {data.learning.length > 0
              ? `Continue your learning or explore what’s new.${unread > 0 ? ` You have ${unread} unread updates.` : ""}`
              : "Find a course to begin learning."}
          </p>
        </div>
        <Link href="/dashboard/courses" className={buttonClass("primary", "sm", "w-full sm:w-auto")}>
          Explore courses
        </Link>
      </header>

      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Continue learning</h2>
            <p className="mt-1 text-sm text-muted">Pick up where you left off in an active course.</p>
          </div>
          <Link href="/dashboard/my-learning" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">
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
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.learning.slice(0, 3).map((row) => (
              <li key={row.id} className="min-w-0">
                <CourseCardLive course={row.course} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {upcoming && (
        <section className="grid gap-5 rounded-xl border border-rule bg-paper p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted">Next live session</p>
            <h2 className="mt-1 font-display text-xl font-semibold text-ink">{upcoming.title}</h2>
            <p className="mt-1 text-sm text-muted">
              {upcoming.course.title}, {formatDate(upcoming.scheduledAt)}, {upcoming.durationMin} min
            </p>
            {new Date(upcoming.scheduledAt).getTime() > now && (
              <p className="mt-2 text-sm font-medium text-accent">
                Starts in {formatCountdown(new Date(upcoming.scheduledAt).getTime() - now)}
              </p>
            )}
          </div>
          <a href={upcoming.meetingUrl} target="_blank" rel="noreferrer" className={buttonClass("primary", "sm", "w-full sm:w-auto")}>
            Join session
          </a>
        </section>
      )}

      {data.upcomingMeetings.length > 1 && (
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-ink">More upcoming sessions</h2>
            <Link href="/dashboard/my-learning" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">Your courses</Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.upcomingMeetings.slice(1, 5).map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-rule bg-paper p-4">
                <div>
                  <p className="text-sm font-semibold text-ink">{m.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {m.course.title}, {formatDate(m.scheduledAt)}, {m.durationMin} min
                  </p>
                </div>
                <a href={m.meetingUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-accent hover:underline">
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
              <p className="mt-0.5 text-sm text-slate-500">Recent courses in the catalogue.</p>
            </div>
            <Link href="/dashboard/courses" className="text-sm font-medium text-slate-600 hover:text-ink-900">
              View all
            </Link>
          </div>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {explore.slice(0, 3).map((c) => (
              <li key={c.id} className="min-w-0">
                <CourseCardLive course={c} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="progress-h">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 id="progress-h" className="font-display text-xl font-semibold text-ink">Your progress</h2>
          <Link href="/dashboard/progress" className="text-sm font-semibold text-accent underline-offset-4 hover:underline">
            Details
          </Link>
        </div>
        <ProgressView compact />
      </section>

      <CommunityCoursePoll />

      {data.applications.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-xl font-semibold text-ink-900">Mentor applications</h2>
          <ul className="divide-y divide-rule border-y border-rule">
            {data.applications.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-4">
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
