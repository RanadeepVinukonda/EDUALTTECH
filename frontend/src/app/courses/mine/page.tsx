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
              <CourseCard
                key={a.id}
                course={a.course}
                badge={
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
                    <Clock className="h-3.5 w-3.5" />
                    {a.status === "INTERVIEW" ? "Interview" : a.status === "UNDER_REVIEW" ? "Under review" : "Pending"}
                  </span>
                }
              />
            ))}
          </div>
        )}
        {mentoring.length === 0 && pending.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-slate-500">You are not mentoring any course yet.</p>
            <Link href="/teachers/apply" className="mt-3 inline-block font-semibold text-brand-700 hover:text-brand-800">
              Apply to mentor →
            </Link>
          </div>
        ) : mentoring.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mentoring.map((m) => (
              <CourseCard
                key={m.id}
                course={m.course}
                badge={
                  <span className="text-xs text-slate-500">
                    {m.capacity} seats · {m._count?.enrollments ?? 0} learners
                  </span>
                }
              />
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

/** One course card, shared by live mentorships and pending applications. */
function CourseCard({
  course,
  badge,
}: {
  course: { slug: string; title: string; thumbnailUrl: string | null; subject: string };
  badge: React.ReactNode;
}) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm"
    >
      {course.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={course.thumbnailUrl} alt="" className="h-36 w-full object-cover" />
      ) : (
        <div className="flex h-36 items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100">
          <span className="rounded-xl brand-grad px-3 py-1.5 text-sm font-bold text-white">{course.subject[0]}</span>
        </div>
      )}
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{course.subject}</p>
        <h3 className="font-display mt-1 text-lg font-semibold text-slate-900 group-hover:text-brand-800">{course.title}</h3>
        <div className="mt-2">{badge}</div>
      </div>
    </Link>
  );
}
