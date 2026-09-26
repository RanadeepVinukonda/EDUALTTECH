"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Loader } from "@/components/Loader";

interface DashboardData {
  enrollments: Array<{
    id: string;
    progressPct: number;
    status: string;
    course: { id: string; title: string; slug: string; subject: string };
  }>;
  quizAttempts: Array<{ id: string; score: number; passed: boolean; quiz: { title: string }; createdAt: string }>;
  practiceStats: Array<{ result: string; _count: number }>;
  avgQuizScore: number;
  streak: { current: number; longest: number };
  activity: Array<{ day: string; kind: string; count: number }>;
}

export default function StudentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<DashboardData>("/dashboard/me")
      .then(setData)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load dashboard"));
  }, []);

  if (error) return <div className="mx-auto max-w-7xl px-4 py-16 text-red-600">{error}</div>;
  if (!data) return <Loader label="Loading your dashboard…" />;

  const accepted = data.practiceStats.find((s) => s.result === "ACCEPTED")?._count ?? 0;
  const totalAttempts = data.practiceStats.reduce((sum, s) => sum + s._count, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-slate-900">Your learning dashboard</h1>
      <p className="mt-1 text-slate-600">Progress, scores and streaks — all in one place.</p>

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link href="/profile" className="font-semibold text-brand-700 hover:text-brand-800">
          Edit profile
        </Link>
        <Link href="/teacher" className="font-semibold text-brand-700 hover:text-brand-800">
          Mentor workspace
        </Link>
        <Link href="/notifications" className="font-semibold text-brand-700 hover:text-brand-800">
          Notifications
        </Link>
        <Link href="/orders" className="font-semibold text-brand-700 hover:text-brand-800">
          My orders
        </Link>
      </div>

      {/* Metric cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Enrolled courses" value={String(data.enrollments.length)} />
        <MetricCard label="Avg quiz score" value={`${data.avgQuizScore}%`} />
        <MetricCard label="Current streak" value={`${data.streak.current}d`} />
        <MetricCard label="Problems solved" value={`${accepted}/${totalAttempts}`} />
      </div>

      {/* Enrolled courses */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold text-slate-900">My courses</h2>
          <Link href="/courses" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
            Browse all →
          </Link>
        </div>
        {data.enrollments.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            No enrollments yet — your digital classroom is waiting.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.enrollments.map((e) => (
              <Link
                key={e.id}
                href={`/courses/${e.course.slug}`}
                className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-brand-300 hover:shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{e.course.subject}</p>
                <p className="mt-1 font-semibold text-slate-900">{e.course.title}</p>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${e.progressPct}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{e.progressPct}% complete</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent quizzes */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-slate-900">Recent quiz scores</h2>
        {data.quizAttempts.length === 0 ? (
          <p className="mt-4 text-slate-500">No quizzes attempted yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {data.quizAttempts.map((q) => (
              <li key={q.id} className="flex items-center justify-between px-5 py-3">
                <span className="text-slate-700">{q.quiz.title}</span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${q.passed ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"}`}>
                  {Math.round(q.score)}% {q.passed ? "· passed" : "· retry"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-display mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
