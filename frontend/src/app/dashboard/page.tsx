"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Flame, GraduationCap, Percent, Trophy } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { Loader } from "@/components/Loader";
import { useMinLoading } from "@/lib/useMinLoading";
import ActivityTrend, { type ActivityRow } from "@/components/dashboard/ActivityTrend";
import CourseProgressList from "@/components/dashboard/CourseProgressList";
import EmptyDashboard from "@/components/dashboard/EmptyDashboard";
import MetricTile from "@/components/dashboard/MetricTile";
import RecommendationCard from "@/components/dashboard/RecommendationCard";
import ResumeCard, { type Enrollment } from "@/components/dashboard/ResumeCard";

interface DashboardData {
  enrollments: Enrollment[];
  quizAttempts: Array<{ id: string; score: number; passed: boolean; quiz: { title: string }; createdAt: string }>;
  practiceStats: Array<{ result: string; _count: number }>;
  avgQuizScore: number;
  streak: { current: number; longest: number };
  activity: ActivityRow[];
}

export default function StudentDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = useMinLoading(data !== null);

  useEffect(() => {
    api<DashboardData>("/dashboard/me")
      .then(setData)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load dashboard"));
  }, []);

  if (error) return <div className="mx-auto max-w-7xl px-4 py-16 text-red-600">{error}</div>;
  if (!data || loading) return <Loader />;

  const accepted = data.practiceStats.find((s) => s.result === "ACCEPTED")?._count ?? 0;
  const totalAttempts = data.practiceStats.reduce((sum, s) => sum + s._count, 0);
  const completed = data.enrollments.filter((e) => e.progressPct >= 100);
  const inProgress = data.enrollments.filter((e) => e.progressPct < 100);
  const resume = [...inProgress].sort((a, b) => b.progressPct - a.progressPct)[0];
  const lastFailed = data.quizAttempts.find((q) => !q.passed);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900">Your learning dashboard</h1>
          <p className="mt-1 text-slate-600">Progress, scores and streaks — all in one place.</p>
        </div>
        <Link href="/courses/mine" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
          My courses →
        </Link>
      </div>

      {/* Analytics */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricTile
          label="Enrolled courses"
          value={String(data.enrollments.length)}
          hint={completed.length > 0 ? `${completed.length} completed` : undefined}
          icon={<GraduationCap className="h-4 w-4" />}
        />
        <MetricTile
          label="Avg quiz score"
          value={`${data.avgQuizScore}%`}
          hint="Last 10 attempts"
          icon={<Percent className="h-4 w-4" />}
        />
        <MetricTile
          label="Current streak"
          value={`${data.streak.current}d`}
          hint={data.streak.longest > data.streak.current ? `Best ${data.streak.longest}d` : "Keep it going"}
          icon={<Flame className="h-4 w-4" />}
        />
        <MetricTile
          label="Problems solved"
          value={`${accepted}/${totalAttempts}`}
          hint="Accepted attempts"
          icon={<Trophy className="h-4 w-4" />}
        />
      </div>

      <div className="mt-6">
        <ActivityTrend activity={data.activity} />
      </div>

      {/* Progress */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-slate-900">Your progress</h2>
        {data.enrollments.length === 0 ? (
          <div className="mt-4">
            <EmptyDashboard />
          </div>
        ) : (
          <>
            {resume && (
              <div className="mt-4">
                <ResumeCard enrollment={resume} />
              </div>
            )}
            <div className="mt-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">All courses</h3>
              <div className="mt-3">
                <CourseProgressList enrollments={data.enrollments} />
              </div>
            </div>
          </>
        )}
      </section>

      {/* Recommendations — all derived from the learner's own data, never invented */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-slate-900">Recommended for you</h2>
        <p className="mt-1 text-sm text-slate-600">Based on what you&apos;re learning and where you left off.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {resume && (
            <RecommendationCard
              icon={BookOpen}
              title={`Continue ${resume.course.title}`}
              why={`You are ${Math.round(resume.progressPct)}% through this course.`}
              href={`/courses/${resume.course.slug}`}
              cta="Resume course"
            />
          )}
          {lastFailed && (
            <RecommendationCard
              icon={Trophy}
              title={`Retry ${lastFailed.quiz.title}`}
              why={`You scored ${Math.round(lastFailed.score)}% last time.`}
              href={resume ? `/courses/${resume.course.slug}` : "/courses/mine"}
              cta="Revisit course"
            />
          )}
          <RecommendationCard
            icon={GraduationCap}
            title={data.enrollments.length === 0 ? "Find your first course" : "Explore more courses"}
            why={
              data.enrollments.length === 0
                ? "Pick a subject and start learning in minutes."
                : "Add a new subject to keep your momentum going."
            }
            href="/courses"
            cta="Browse catalogue"
          />
        </div>
      </section>

      {/* Recent quizzes */}
      {data.quizAttempts.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-slate-900">Recent quiz scores</h2>
          <ul className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {data.quizAttempts.map((q) => (
              <li key={q.id} className="flex items-center justify-between px-5 py-3">
                <span className="text-slate-700">{q.quiz.title}</span>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    q.passed ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"
                  }`}
                >
                  {Math.round(q.score)}% {q.passed ? "· passed" : "· retry"}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
