"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface AdminChapter {
  id: string;
  title: string;
  summary: string | null;
  order: number;
  meetingUrl: string | null;
  recordingUrl: string | null;
  resources: Array<{ label: string; url: string }>;
  modules: Array<{ id: string; title: string; position: number; lessons: Array<{ id: string; title: string; type: string }> }>;
}

interface AdminMentor {
  id: string;
  capacity: number;
  seatsLeft: number;
  mentor: { id: string; name: string; email?: string; avatarUrl: string | null };
  chapters: AdminChapter[];
  _count: { enrollments: number };
}

interface AdminCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string | null;
  thumbnailUrl: string | null;
  pricePaise: number | null;
  isPublished: boolean;
  teacher: { id: string; name: string; email?: string };
  mentors: AdminMentor[];
  _count: { enrollments: number };
}

export default function AdminCourseViewPage() {
  const params = useParams<{ slug: string }>();
  const [course, setCourse] = useState<AdminCourse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ course: AdminCourse & { resources?: unknown[] } }>(`/courses/${params.slug}`)
      .then((d) => setCourse(d.course))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load course"));
  }, [params.slug]);

  if (error) return <div className="mx-auto max-w-5xl px-4 py-16 text-red-600">{error}</div>;
  if (!course) return <div className="mx-auto max-w-5xl px-4 py-16 text-slate-500">Loading course…</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/admin/courses" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
        ← Back to courses
      </Link>
      {course.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={course.thumbnailUrl} alt="" className="mt-4 h-52 w-full rounded-2xl object-cover" />
      )}
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
            {course.subject}{course.gradeLevel ? ` · ${course.gradeLevel}` : ""}
          </p>
          <h1 className="font-display mt-1 text-3xl font-bold text-slate-900">{course.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            Hosted by {course.teacher.name} · {course._count.enrollments} learners
            {course.pricePaise != null && (
              <span className="ml-1 font-semibold text-ink-700">· ₹{(course.pricePaise / 100).toLocaleString("en-IN")}</span>
            )}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${course.isPublished ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"}`}>
          {course.isPublished ? "Published" : "Draft"}
        </span>
      </div>
      <p className="mt-4 max-w-3xl text-slate-600">{course.description}</p>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-slate-900">Mentors ({course.mentors.length})</h2>
        {course.mentors.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            No mentors assigned yet — they join by applying.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {course.mentors.map((m) => (
              <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="font-semibold text-slate-900">{m.mentor.name}</p>
                <p className="text-xs text-slate-500">
                  {m._count.enrollments} learners · capacity {m.capacity} · {m.seatsLeft} seats left
                </p>
                <p className="mt-2 text-xs font-medium text-brand-700">{m.chapters.length} chapters in this roadmap</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-slate-900">Roadmaps</h2>
        {course.mentors.length === 0 || course.mentors.every((m) => m.chapters.length === 0) ? (
          <p className="mt-3 rounded-xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
            No chapters published yet.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {course.mentors.map((m) =>
              m.chapters.map((c) => (
                <article key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {m.mentor.name} · Chapter {c.order}
                  </p>
                  <h3 className="font-display text-lg font-semibold text-slate-900">{c.title}</h3>
                  {c.summary && <p className="mt-1 text-sm text-slate-600">{c.summary}</p>}
                  {c.meetingUrl && (
                    <p className="mt-1 text-xs font-medium text-brand-700">
                      Live session: <a className="underline" href={c.meetingUrl} target="_blank" rel="noopener noreferrer">{c.meetingUrl}</a>
                    </p>
                  )}
                  {c.recordingUrl && (
                    <p className="mt-1 text-xs font-medium text-brand-700">
                      Recording: <a className="underline" href={c.recordingUrl} target="_blank" rel="noopener noreferrer">{c.recordingUrl}</a>
                    </p>
                  )}
                  {c.modules.length > 0 && (
                    <ul className="mt-3 space-y-2">
                      {c.modules.map((mod) => (
                        <li key={mod.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="font-semibold text-slate-800">{mod.position}. {mod.title}</p>
                          {mod.lessons.length > 0 && (
                            <ul className="mt-1 flex flex-wrap gap-2">
                              {mod.lessons.map((l) => (
                                <li key={l.id} className="rounded-full bg-white px-2.5 py-0.5 text-xs text-slate-600">
                                  {l.title} <span className="text-slate-400">{l.type.toLowerCase()}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {c.resources.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {c.resources.map((r) => (
                        <li key={r.url}>
                          <a href={r.url} target="_blank" rel="noopener noreferrer" className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">
                            {r.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              )),
            )}
          </div>
        )}
      </section>
    </div>
  );
}