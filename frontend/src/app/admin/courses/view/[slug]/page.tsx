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

const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

export default function AdminCourseViewPage() {
  const params = useParams<{ slug: string }>();
  const [course, setCourse] = useState<AdminCourse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ course: AdminCourse & { resources?: unknown[] } }>(`/courses/${params.slug}`)
      .then((d) => setCourse(d.course))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load course"));
  }, [params.slug]);

  if (error) return <div className="mx-auto max-w-6xl px-4 py-16 text-red-600">{error}</div>;
  if (!course) return <div className="mx-auto max-w-6xl px-4 py-16 text-slate-500">Loading course…</div>;

  const chapters = course.mentors.flatMap((m) => m.chapters.map((c) => ({ mentor: m.mentor, chapter: c })));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back to courses
      </Link>

      <section className="relative mt-5 overflow-hidden rounded-[20px] bg-ink-800 shadow-elev2">
        {course.thumbnailUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="relative flex flex-col justify-between gap-6 p-6 text-white sm:p-10 lg:flex-row lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-brand-100">
                {course.subject}{course.gradeLevel ? ` · ${course.gradeLevel}` : ""}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${course.isPublished ? "bg-brand-500/20 text-brand-200" : "bg-amber-500/20 text-amber-200"}`}>
                {course.isPublished ? "Published" : "Draft"}
              </span>
            </div>
            <h1 className="font-display mt-4 text-2xl font-bold sm:text-4xl">{course.title}</h1>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/80">
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                </svg>
                {course.teacher.name}
              </span>
              <span className="flex items-center gap-1.5">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                {course._count.enrollments} learners
              </span>
              {course.pricePaise != null && (
                <span className="font-semibold text-white">₹{(course.pricePaise / 100).toLocaleString("en-IN")}</span>
              )}
            </p>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-white/70 lg:max-w-sm">{course.description}</p>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-semibold text-ink-700">Mentors ({course.mentors.length})</h2>
        {course.mentors.length === 0 ? (
          <Empty>No mentors assigned yet — they join by applying.</Empty>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {course.mentors.map((m) => (
              <div key={m.id} className="rounded-[16px] bg-white p-5 shadow-elev2">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {initials(m.mentor.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{m.mentor.name}</p>
                    <p className="truncate text-xs text-slate-500">{m.mentor.email}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <Stat value={m._count.enrollments} label="learners" />
                  <Stat value={m.capacity} label="capacity" />
                  <Stat value={m.seatsLeft} label="seats left" />
                </div>
                <p className="mt-4 rounded-[10px] bg-slate-50 px-3 py-2 text-xs font-medium text-brand-700">
                  {m.chapters.length} chapter{m.chapters.length === 1 ? "" : "s"} in this roadmap
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink-700">Roadmap ({chapters.length} chapters)</h2>
        {chapters.length === 0 ? (
          <Empty>No chapters published yet.</Empty>
        ) : (
          <ol className="mt-4 space-y-1 border-l-2 border-slate-200 pl-6">
            {chapters.map(({ mentor, chapter: c }) => (
              <li key={c.id} className="relative pb-6">
                <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-brand-500 ring-2 ring-slate-200" />
                <article className="rounded-[16px] bg-white p-5 shadow-elev1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {mentor.name} · Chapter {c.order}
                  </p>
                  <h3 className="font-display mt-1 text-lg font-semibold text-slate-900">{c.title}</h3>
                  {c.summary && <p className="mt-1 text-sm text-slate-600">{c.summary}</p>}

                  {(c.meetingUrl || c.recordingUrl) && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {c.meetingUrl && <SessionLink href={c.meetingUrl} kind="live" label="Live session" />}
                      {c.recordingUrl && <SessionLink href={c.recordingUrl} kind="recording" label="Recording" />}
                    </div>
                  )}

                  {c.modules.length > 0 && (
                    <ul className="mt-4 space-y-2">
                      {c.modules.map((mod) => (
                        <li key={mod.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <p className="flex items-center gap-2 font-semibold text-slate-800">
                            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-ink-700 text-[10px] font-bold text-white">{mod.position}</span>
                            {mod.title}
                          </p>
                          {mod.lessons.length > 0 && (
                            <ul className="mt-2 flex flex-wrap gap-2">
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
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                          >
                            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                              <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {r.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-[10px] bg-slate-50 py-2">
      <p className="font-display text-lg font-bold text-ink-700">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">{children}</p>
  );
}

function SessionLink({ href, kind, label }: { href: string; kind: "live" | "recording"; label: string }) {
  const isLive = kind === "live";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        isLive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-ink-100 text-ink-700 hover:bg-ink-200"
      }`}
    >
      {isLive && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />}
      {label}
    </a>
  );
}