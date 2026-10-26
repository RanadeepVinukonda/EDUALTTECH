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
        apiGet<{ items: CourseListItem[] }>("/courses", { limit: 24, sort: "newest" }).catch(() => null),
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

  if (user?.role === "ADMIN") return null;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return <DashboardSkeleton />;

  const interests = new Set(data.learning.map((l) => l.course.category).filter(Boolean));
  const shelf = (items: CourseListItem[]) => items.slice(0, 4);
  const latest = shelf(discover ?? []);
  const trending = shelf(
    [...(discover ?? [])].sort((a, b) => (b.enrolledCount ?? 0) + (b.mentorNames?.length ?? 0) - ((a.enrolledCount ?? 0) + (a.mentorNames?.length ?? 0))),
  );
  const forYou = interests.size === 0
    ? []
    : shelf([...(discover ?? [])].filter((c) => c.category && interests.has(c.category)));

  const DiscoverShelf = ({ title, items, hint }: { title: string; items: CourseListItem[]; hint?: string }) =>
    items.length === 0 ? null : (
      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h3 className="font-display text-xl font-bold text-ink-900">{title}</h3>
            {hint && <p className="mt-0.5 text-sm text-slate-500">{hint}</p>}
          </div>
          <Link href="/dashboard/courses" className="text-sm font-semibold text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((c) => (
            <CourseCard key={c.id} course={c} />
          ))}
        </div>
      </div>
    );

  return (
    <div className="space-y-10">
      <header className="relative overflow-hidden rounded-3xl bg-ink-900 p-6 text-white shadow-elev2 sm:p-8">
        <span aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-white/10" />
        <span aria-hidden className="pointer-events-none absolute -right-6 -top-16 h-44 w-44 rounded-full border border-white/10" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-200">Welcome back</p>
            <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">{user?.firstName}</h1>
            <p className="mt-2 max-w-md text-[15px] text-ink-100">Pick up where you left off, or discover something new.</p>
          </div>
          <div className="min-w-0 shrink-0">
            {data.learning.length > 0 ? (
              <Link
                href={`/dashboard/courses/${data.learning[0].course.slug}`}
                className={buttonClass("primary", "md", "max-w-full shadow-elev2")}
              >
                <span className="truncate">Continue: {data.learning[0].course.title}</span>
              </Link>
            ) : (
              <Link href="/dashboard/courses" className={buttonClass("primary", "md", "shadow-elev2")}>
                Browse courses
              </Link>
            )}
          </div>
        </div>
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

      {(latest.length > 0 || forYou.length > 0 || trending.length > 0) && (
        <section aria-labelledby="discover-h" className="space-y-10">
          <div>
            <h2 id="discover-h" className="font-display text-xl font-bold text-ink-900">Discover courses</h2>
            <p className="mt-0.5 text-sm text-slate-500">Fresh picks from the catalogue, tailored to you.</p>
          </div>
          <DiscoverShelf title="Latest courses" hint="Fresh additions to the catalogue" items={latest} />
          <DiscoverShelf title="For you" hint="Courses in the areas you are learning" items={forYou} />
          <DiscoverShelf title="Trending" hint="Most popular with our mentors and learners" items={trending} />
        </section>
      )}

      <section aria-labelledby="progress-h">
        <h2 id="progress-h" className="mb-3 font-display text-xl font-bold text-ink-900">Your progress</h2>
        <ProgressView compact />
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold text-ink-900">Upcoming live sessions</h2>
        {data.upcomingMeetings.length === 0 ? (
          <EmptyState title="No sessions scheduled" description="Live sessions for your courses will appear here." />
        ) : (
          <ul className="space-y-3">
            {data.upcomingMeetings.map((m) => {
              const start = new Date(m.scheduledAt).getTime();
              const end = start + m.durationMin * 60_000;
              return (
                <li key={m.id} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-elev1">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900">{m.title}</p>
                      <p className="text-sm text-slate-500">
                        {m.course.title} · {formatDate(m.scheduledAt)} · {m.durationMin} min
                      </p>
                      {start > now ? (
                        <p className="mt-1 text-sm font-semibold text-brand-600">Starts in {formatCountdown(start - now)}</p>
                      ) : end >= now ? (
                        <p className="mt-1 text-sm font-semibold text-green-700">Live now</p>
                      ) : null}
                    </div>
                    <a href={m.meetingUrl} target="_blank" rel="noreferrer" className={buttonClass("secondary", "sm")}>
                      Join session
                    </a>
                  </div>
                </li>
              );
            })}
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
