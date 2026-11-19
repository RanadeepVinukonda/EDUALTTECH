"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import School from "@mui/icons-material/School";
import MenuBook from "@mui/icons-material/MenuBook";
import Videocam from "@mui/icons-material/Videocam";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Handshake from "@mui/icons-material/Handshake";
import EmojiEvents from "@mui/icons-material/EmojiEvents";
import PlayArrow from "@mui/icons-material/PlayArrow";
import CheckCircle from "@mui/icons-material/CheckCircle";
import AutoAwesome from "@mui/icons-material/AutoAwesome";
import NotificationsNone from "@mui/icons-material/NotificationsNone";
import TrendingUp from "@mui/icons-material/TrendingUp";
import ReceiptLong from "@mui/icons-material/ReceiptLong";
import { apiGet } from "@/lib/api";
import { describeError } from "@/lib/errors";
import { useAuth } from "./AuthProvider";
import type { DashboardData } from "@/lib/app-types";
import { formatDate, formatCountdown } from "@/lib/format";
import Skeleton from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import type { CourseListItem } from "@/lib/types";
import ProgressView from "./ProgressView";
import Spinner from "@/components/ui/Spinner";
import CourseCardLive from "@/components/landing/CourseCardLive";
import CommunityCoursePoll from "@/components/landing/CommunityCoursePoll";
import { cn } from "@/lib/cn";

function getGreeting(firstName?: string | null): string {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return firstName ? `${timeGreeting}, ${firstName}` : `${timeGreeting}, Learner`;
}

function getApplicationMeta(status: string) {
  switch (status) {
    case "INTERVIEW_SCHEDULED":
      return {
        label: "Interview Scheduled",
        toneClass: "bg-purple-50 text-purple-700 border-purple-200",
        dotClass: "bg-purple-600",
        desc: "Great news! Your application has advanced to the faculty evaluation interview. Our team is coordinating the calendar slot. Check your email or notifications for details.",
      };
    case "UNDER_REVIEW":
      return {
        label: "Under Review",
        toneClass: "bg-amber-50 text-amber-700 border-amber-200",
        dotClass: "bg-amber-600",
        desc: "A curriculum lead is reviewing your project portfolio and syllabus submission. Reviews typically complete within 2–3 business days.",
      };
    case "ACCEPTED":
      return {
        label: "Application Approved",
        toneClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        dotClass: "bg-emerald-600",
        desc: "You are approved as a mentor! Your teaching workspace is ready for course management and student assignments.",
      };
    case "REJECTED":
      return {
        label: "Not Selected",
        toneClass: "bg-slate-50 text-slate-700 border-slate-200",
        dotClass: "bg-slate-500",
        desc: "Thank you for applying. While this application was not selected, you are invited to apply for other upcoming topics.",
      };
    case "SUBMITTED":
    default:
      return {
        label: "Application Submitted",
        toneClass: "bg-blue-50 text-blue-700 border-blue-200",
        dotClass: "bg-blue-600",
        desc: "Your mentor application is in our review queue. No further action is required from you right now.",
      };
  }
}

function DashboardSkeleton() {
  return (
    <div className="space-y-10" role="status" aria-live="polite">
      <span className="sr-only">Loading your dashboard…</span>
      <div className="rounded-3xl border border-rule/80 bg-paper p-6 sm:p-8">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="mt-4 h-10 w-72 sm:w-96" />
        <Skeleton className="mt-2 h-4 w-60" />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 border-t border-rule/70 pt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-rule bg-paper">
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
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

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

  const categories = useMemo(() => {
    if (!discover || discover.length === 0) return ["ALL"];
    const cats = new Set<string>();
    discover.forEach((c) => {
      if (c.category) cats.add(c.category);
    });
    return ["ALL", ...Array.from(cats)];
  }, [discover]);

  const filteredDiscover = useMemo(() => {
    if (!discover) return [];
    if (activeCategory === "ALL") return discover.slice(0, 6);
    return discover.filter((c) => c.category === activeCategory).slice(0, 6);
  }, [discover, activeCategory]);

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
  const unread = data.unreadNotifications + data.unreadMessages;
  const enrolledCount = data.learning.length;

  return (
    <div className="mx-auto max-w-6xl space-y-12">
      {/* 1. Personalized Welcome & Pulse Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-rule bg-white p-6 sm:p-8 shadow-elev1">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50/80 px-3 py-1 text-xs font-semibold text-[#025926]">
              <School sx={{ fontSize: 15 }} />
              <span>Learner Studio</span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl lg:text-4xl">
              {getGreeting(user?.firstName)}
            </h1>
            <p className="mt-2 text-sm sm:text-base leading-relaxed text-ink-2">
              {enrolledCount > 0
                ? `You have ${enrolledCount} active course${enrolledCount > 1 ? "s" : ""} in progress. Continue building your capstones or check upcoming mentor sessions.`
                : "Explore mentor-led, project-driven courses in AI, software engineering, and creative technology."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/dashboard/courses"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#025926] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
            >
              <MenuBook sx={{ fontSize: 17 }} />
              Explore courses
            </Link>
            <Link
              href="/resources"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rule bg-white px-4 text-sm font-semibold text-ink shadow-2xs transition hover:bg-paper-2"
            >
              Learning paths
            </Link>
          </div>
        </div>

        {/* Quick Pulse Metrics Bar */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 border-t border-rule/70 pt-6">
          <Link
            href="/dashboard/my-learning"
            className="group flex flex-col justify-between rounded-2xl border border-rule bg-paper-2/60 p-4 shadow-2xs transition hover:border-brand-300 hover:bg-paper hover:shadow-xs"
          >
            <div className="flex items-center justify-between text-muted group-hover:text-[#025926]">
              <span className="text-xs font-medium">Enrolled Courses</span>
              <School sx={{ fontSize: 18 }} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-ink">{enrolledCount}</span>
              <span className="text-xs text-muted">Active</span>
            </div>
          </Link>

          <Link
            href="/dashboard/progress"
            className="group flex flex-col justify-between rounded-2xl border border-rule bg-paper-2/60 p-4 shadow-2xs transition hover:border-brand-300 hover:bg-paper hover:shadow-xs"
          >
            <div className="flex items-center justify-between text-muted group-hover:text-[#025926]">
              <span className="text-xs font-medium">Live Sessions</span>
              <Videocam sx={{ fontSize: 18 }} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-ink">
                {data.upcomingMeetings.length}
              </span>
              <span className="text-xs text-muted">Scheduled</span>
            </div>
          </Link>

          <Link
            href="/dashboard/mentor"
            className="group flex flex-col justify-between rounded-2xl border border-rule bg-paper-2/60 p-4 shadow-2xs transition hover:border-brand-300 hover:bg-paper hover:shadow-xs"
          >
            <div className="flex items-center justify-between text-muted group-hover:text-[#025926]">
              <span className="text-xs font-medium">Mentorship</span>
              <Handshake sx={{ fontSize: 18 }} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-ink">
                {data.applications.length > 0 ? data.applications.length : data.mentoring.length}
              </span>
              <span className="text-xs text-muted truncate">
                {data.applications.length > 0
                  ? "Applications"
                  : data.mentoring.length > 0
                    ? "Mentoring"
                    : "Become mentor"}
              </span>
            </div>
          </Link>

          <Link
            href="/dashboard/notifications"
            className="group flex flex-col justify-between rounded-2xl border border-rule bg-paper-2/60 p-4 shadow-2xs transition hover:border-brand-300 hover:bg-paper hover:shadow-xs"
          >
            <div className="flex items-center justify-between text-muted group-hover:text-[#025926]">
              <span className="text-xs font-medium">Updates</span>
              <NotificationsNone sx={{ fontSize: 18 }} />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display text-2xl font-bold text-ink">{unread}</span>
              <span className="text-xs text-muted">Unread</span>
            </div>
          </Link>
        </div>
      </section>

      {/* 2. High-Priority Mentor Application Tracker */}
      {data.applications.length > 0 && (
        <section aria-labelledby="mentor-apps-heading" className="space-y-4">
          {data.applications.map((app) => {
            const meta = getApplicationMeta(app.status);
            return (
              <div
                key={app.id}
                className="relative overflow-hidden rounded-2xl border border-purple-200/90 bg-white p-5 sm:p-6 shadow-elev1"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-purple-600 text-white shadow-sm">
                      <Handshake sx={{ fontSize: 26 }} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                            meta.toneClass,
                          )}
                        >
                          <span className={cn("h-2 w-2 rounded-full animate-pulse", meta.dotClass)} />
                          {meta.label}
                        </span>
                        <span className="text-xs text-muted">
                          Applied {formatDate(app.createdAt)}
                        </span>
                      </div>
                      <h2 id="mentor-apps-heading" className="mt-1.5 font-display text-lg font-bold text-ink">
                        Mentor Application: {app.course.title}
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-ink-2 max-w-2xl leading-relaxed">
                        {meta.desc}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/dashboard/mentor/applications/${app.id}`}
                    className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-purple-300 bg-white px-4 text-xs sm:text-sm font-semibold text-purple-700 shadow-2xs transition hover:bg-purple-50"
                  >
                    View application details
                    <ArrowForward sx={{ fontSize: 15 }} />
                  </Link>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* 3. Live Session Spotlight Alert */}
      {upcoming && (
        <section aria-labelledby="live-session-heading">
          <div className="relative overflow-hidden rounded-2xl border border-brand-200/90 bg-white p-5 sm:p-6 shadow-elev1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#025926] text-white shadow-sm">
                  <Videocam sx={{ fontSize: 26 }} />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-semibold text-brand-800">
                      <span className="h-2 w-2 rounded-full bg-[#025926] animate-pulse" />
                      Next Live Session
                    </span>
                    {new Date(upcoming.scheduledAt).getTime() > now && (
                      <span className="text-xs font-semibold text-[#025926]">
                        Starts in {formatCountdown(new Date(upcoming.scheduledAt).getTime() - now)}
                      </span>
                    )}
                  </div>
                  <h2 id="live-session-heading" className="mt-1.5 font-display text-lg font-bold text-ink">
                    {upcoming.title}
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-muted">
                    {upcoming.course.title} · {formatDate(upcoming.scheduledAt)} · {upcoming.durationMin} min
                  </p>
                </div>
              </div>

              <a
                href={upcoming.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#025926] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
              >
                <PlayArrow sx={{ fontSize: 18 }} />
                Join session now
              </a>
            </div>
          </div>
        </section>
      )}

      {/* More upcoming meetings if > 1 */}
      {data.upcomingMeetings.length > 1 && (
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-ink">More upcoming sessions</h2>
            <Link
              href="/dashboard/my-learning"
              className="text-sm font-semibold text-[#025926] underline-offset-4 hover:underline"
            >
              Your courses
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {data.upcomingMeetings.slice(1, 5).map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rule bg-white p-4 shadow-2xs"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">{m.title}</p>
                  <p className="mt-0.5 text-xs text-muted">
                    {m.course.title} · {formatDate(m.scheduledAt)} · {m.durationMin} min
                  </p>
                </div>
                <a
                  href={m.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#025926] hover:underline"
                >
                  Join
                  <ArrowForward sx={{ fontSize: 13 }} />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4. Continue Learning (Active courses or Kickstart Card) */}
      <section>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Continue learning</h2>
            <p className="mt-1 text-sm text-muted">Pick up where you left off in an active course.</p>
          </div>
          <Link
            href="/dashboard/my-learning"
            className="text-sm font-semibold text-[#025926] underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>

        {enrolledCount === 0 ? (
          <div className="overflow-hidden rounded-3xl border border-rule/80 bg-white p-6 sm:p-8 shadow-elev1">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-[#025926]">
                  <AutoAwesome sx={{ fontSize: 14 }} />
                  <span>Start Your Skill Journey</span>
                </div>
                <h3 className="mt-3 font-display text-xl sm:text-2xl font-bold text-ink">
                  Ready to master in-demand skills with 1-on-1 mentors?
                </h3>
                <p className="mt-2 text-sm sm:text-base leading-relaxed text-ink-2 max-w-2xl">
                  You are not enrolled in any courses yet. Every EduAltTech track is mentor-led, practical,
                  and focused on building real portfolio capstones for a flat price of ₹699.
                </p>

                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2.5 rounded-xl border border-rule/70 bg-paper-2/60 px-3.5 py-2.5">
                    <CheckCircle sx={{ fontSize: 16, color: "#025926" }} />
                    <span className="text-xs font-medium text-ink">Hands-on Capstones</span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-rule/70 bg-paper-2/60 px-3.5 py-2.5">
                    <CheckCircle sx={{ fontSize: 16, color: "#025926" }} />
                    <span className="text-xs font-medium text-ink">1-on-1 Mentorship</span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-xl border border-rule/70 bg-paper-2/60 px-3.5 py-2.5">
                    <CheckCircle sx={{ fontSize: 16, color: "#025926" }} />
                    <span className="text-xs font-medium text-ink">Flat ₹699 Lifetime</span>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    href="/dashboard/courses"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#025926] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800"
                  >
                    Browse 35+ Courses
                    <ArrowForward sx={{ fontSize: 15 }} />
                  </Link>
                  <Link
                    href="/resources"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rule bg-white px-4 text-sm font-semibold text-ink shadow-2xs transition hover:bg-paper-2"
                  >
                    Explore Free Tutorials
                  </Link>
                </div>
              </div>

              <div className="lg:col-span-4 rounded-2xl border border-rule/80 bg-paper-2/70 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Popular Starter Tracks
                </p>
                <ul className="mt-3 divide-y divide-rule/70">
                  <li className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">C Programming Fundamentals</span>
                    <span className="font-semibold text-[#025926]">₹699</span>
                  </li>
                  <li className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">UI/UX Design in Figma</span>
                    <span className="font-semibold text-[#025926]">₹699</span>
                  </li>
                  <li className="py-2.5 flex items-center justify-between text-xs">
                    <span className="font-semibold text-ink">Startup & Entrepreneurship</span>
                    <span className="font-semibold text-[#025926]">₹699</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
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

      {/* 5. Explore Courses with Category Filters */}
      {filteredDiscover.length > 0 && (
        <section>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">Explore courses</h2>
              <p className="mt-1 text-sm text-muted">Handpicked courses in technology, engineering, and creative arts.</p>
            </div>
            <Link
              href="/dashboard/courses"
              className="text-sm font-semibold text-[#025926] underline-offset-4 hover:underline"
            >
              View all 35+ courses
            </Link>
          </div>

          {/* Interactive Category Chips */}
          {categories.length > 1 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
                    activeCategory === cat
                      ? "bg-[#025926] text-white shadow-xs"
                      : "border border-rule bg-white text-ink-2 hover:border-brand-300 hover:text-[#025926]",
                  )}
                >
                  {cat === "ALL" ? "All Courses" : cat}
                </button>
              ))}
            </div>
          )}

          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDiscover.map((c) => (
              <li key={c.id} className="min-w-0">
                <CourseCardLive course={c} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 6. Learning Progress & Milestone Tracker */}
      <section aria-labelledby="progress-h">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <h2 id="progress-h" className="font-display text-2xl font-semibold text-ink">
              Your progress
            </h2>
            <p className="mt-1 text-sm text-muted">Track topics completed, milestone checkpoints, and certificates.</p>
          </div>
          <Link
            href="/dashboard/progress"
            className="text-sm font-semibold text-[#025926] underline-offset-4 hover:underline"
          >
            Details
          </Link>
        </div>

        {enrolledCount === 0 ? (
          <div className="rounded-2xl border border-rule/80 bg-white p-6 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <EmojiEvents sx={{ fontSize: 24 }} />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-ink">
                    Progress & Certification Tracker
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted max-w-xl">
                    Once enrolled, your real-time lesson progress, chapter milestones, mentor evaluations,
                    and verified course certificates will appear here.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard/courses"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-rule bg-paper-2 px-4 text-xs font-semibold text-ink transition hover:border-brand-300 hover:bg-brand-50"
              >
                Enroll to start tracking
                <ArrowForward sx={{ fontSize: 13 }} />
              </Link>
            </div>
          </div>
        ) : (
          <ProgressView compact />
        )}
      </section>

      {/* 7. Community Course Poll (Showdown) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-[#025926]">
            <TrendingUp sx={{ fontSize: 13 }} />
            Community Voice
          </span>
        </div>
        <CommunityCoursePoll />
      </section>

      {/* 8. Quick Launchpad & Resource Shortcuts */}
      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/resources"
          className="group rounded-2xl border border-rule bg-white p-5 shadow-2xs transition hover:border-brand-300 hover:shadow-xs"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-[#025926] transition group-hover:scale-105">
            <MenuBook fontSize="small" />
          </div>
          <h3 className="mt-3 font-display text-sm font-semibold text-ink group-hover:text-[#025926]">
            Free Resources & Tutorials
          </h3>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            Curated reading guides, code templates, and cheat sheets for independent builders.
          </p>
        </Link>

        <Link
          href="/dashboard/mentor"
          className="group rounded-2xl border border-rule bg-white p-5 shadow-2xs transition hover:border-brand-300 hover:shadow-xs"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-700 transition group-hover:scale-105">
            <Handshake fontSize="small" />
          </div>
          <h3 className="mt-3 font-display text-sm font-semibold text-ink group-hover:text-purple-700">
            Mentor & Teaching Hub
          </h3>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            Have industry experience? Mentor students, host code reviews, and earn paid teaching income.
          </p>
        </Link>

        <Link
          href="/dashboard/orders"
          className="group rounded-2xl border border-rule bg-white p-5 shadow-2xs transition hover:border-brand-300 hover:shadow-xs"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 transition group-hover:scale-105">
            <ReceiptLong fontSize="small" />
          </div>
          <h3 className="mt-3 font-display text-sm font-semibold text-ink group-hover:text-emerald-700">
            Orders & Receipts
          </h3>
          <p className="mt-1 text-xs text-muted leading-relaxed">
            Access purchase history, download GST invoices, and verify enrollment records.
          </p>
        </Link>
      </section>
    </div>
  );
}
