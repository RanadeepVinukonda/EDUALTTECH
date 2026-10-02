"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { Loader } from "@/components/Loader";
import { useMinLoading } from "@/lib/useMinLoading";
import { Clock, GraduationCap, Presentation } from "lucide-react";

interface EnrolledCourse {
  id: string;
  status: string;
  progressPct: number;
  course: { id: string; slug: string; title: string; thumbnailUrl: string | null; subject: string };
  courseMentor: { id: string; capacity: number; mentor: { id: string; name: string; avatarUrl: string | null } } | null;
}

interface MentorApplication {
  id: string;
  status: "PENDING" | "UNDER_REVIEW" | "INTERVIEW" | "APPROVED" | "REJECTED";
  reviewNote: string | null;
  course: { id: string; slug: string; title: string; thumbnailUrl: string | null; subject: string };
}

interface MentorCourse {
  id: string;
  capacity: number;
  _count?: { enrollments: number };
  course: { id: string; slug: string; title: string; thumbnailUrl: string | null; subject: string };
}

export default function MyCoursesPage() {
  const [data, setData] = useState<{ seeking: EnrolledCourse[]; mentoring: MentorCourse[]; applying: MentorApplication[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = useMinLoading(data !== null);

  useEffect(() => {
    api<{ seeking: EnrolledCourse[]; mentoring: MentorCourse[]; applying: MentorApplication[] }>("/courses/mine")
      .then(setData)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load your courses"));
  }, []);

  if (error) return <div className="mx-auto max-w-7xl px-4 py-16 text-red-600">{error}</div>;
  if (!data || loading) return <Loader />;

  const { seeking, mentoring, applying } = data;
  // Approved applicants already appear in `mentoring` via their courseMentor row.
  const pending = applying.filter((a) => a.status !== "APPROVED" && a.status !== "REJECTED");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-slate-900">My courses</h1>
      <p className="mt-1 text-slate-600">Everything you are learning or mentoring — in one page.</p>

      {/* Seeker half */}
      <section className="mt-10">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-brand-600" />
          <h2 className="font-display text-xl font-semibold text-slate-900">Learning as a student</h2>
        </div>
        {seeking.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-slate-500">You are not enrolled in any course yet.</p>
            <Link href="/courses" className="mt-3 inline-block font-semibold text-brand-700 hover:text-brand-800">
              Browse courses →
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {seeking.map((e) => (
              <Link
                key={e.id}
                href={`/courses/${e.course.slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm"
              >
                {e.course.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.course.thumbnailUrl} alt="" className="h-36 w-full object-cover" />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100">
                    <span className="rounded-xl brand-grad px-3 py-1.5 text-sm font-bold text-white">{e.course.subject[0]}</span>
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{e.course.subject}</p>
                  <h3 className="font-display mt-1 text-lg font-semibold text-slate-900 group-hover:text-brand-800">{e.course.title}</h3>
                  {e.courseMentor && <p className="mt-1 text-xs text-slate-500">Mentor: {e.courseMentor.mentor.name}</p>}
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${e.progressPct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{Math.round(e.progressPct)}% complete</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Mentoring half */}
      <section className="mt-12">
        <div className="flex items-center gap-2">
          <Presentation className="h-5 w-5 text-brand-600" />
          <h2 className="font-display text-xl font-semibold text-slate-900">Mentoring</h2>
        </div>
        {pending.length > 0 && (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pending.map((a) => (
              <Link
                key={a.id}
                href={`/courses/${a.course.slug}`}
                className="group flex items-center gap-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 transition hover:border-amber-400"
              >
                {a.course.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.course.thumbnailUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />
                ) : (
                  <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl brand-grad text-lg font-bold text-white">
                    {a.course.subject[0]}
                  </span>
                )}
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-800">
                    <Clock className="h-3.5 w-3.5" />
                    {a.status === "INTERVIEW" ? "Interview scheduled" : a.status === "UNDER_REVIEW" ? "Under review" : "Pending"}
                  </p>
                  <h3 className="font-display mt-1 truncate text-base font-semibold text-slate-900">{a.course.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-600">Mentor application awaiting admin review.</p>
                </div>
              </Link>
            ))}
          </div>
        )}
        {mentoring.length === 0 ? (
          <div className={`rounded-xl border border-dashed border-slate-300 p-8 text-center ${pending.length > 0 ? "mt-4" : "mt-4"}`}>
            <p className="text-slate-500">
              {pending.length > 0
                ? "Your pending application above unlocks mentoring once an admin approves it."
                : "You are not mentoring any course yet."}
            </p>
            {pending.length === 0 && (
              <Link href="/teachers/apply" className="mt-3 inline-block font-semibold text-brand-700 hover:text-brand-800">
                Apply to mentor →
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mentoring.map((m) => (
              <Link
                key={m.id}
                href={`/courses/${m.course.slug}`}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm"
              >
                {m.course.thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.course.thumbnailUrl} alt="" className="h-36 w-full object-cover" />
                ) : (
                  <div className="flex h-36 items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100">
                    <span className="rounded-xl brand-grad px-3 py-1.5 text-sm font-bold text-white">{m.course.subject[0]}</span>
                  </div>
                )}
                <div className="p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{m.course.subject}</p>
                  <h3 className="font-display mt-1 text-lg font-semibold text-slate-900 group-hover:text-brand-800">{m.course.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {m.capacity} seats · {m._count?.enrollments ?? 0} learners
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}