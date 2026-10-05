"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import LoadingScreen from "@/components/ui/LoadingScreen";
import CourseRoadmap, { type RoadmapChapter } from "@/components/courses/CourseRoadmap";

type AdminChapter = RoadmapChapter;

interface AdminMentor {
  id: string;
  capacity: number;
  seatsLeft: number;
  mentor: { id: string; name: string; email?: string; avatarUrl: string | null };
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
  chapters: AdminChapter[];
  roadmapTitle: string | null;
  roadmapSummary: string | null;
  roadmapMeetingUrl: string | null;
  roadmapRecordingUrl: string | null;
  roadmapResources: Array<{ label: string; url: string }>;
  _count: { enrollments: number; chapters: number; modules: number; lessons: number };
}

const initials = (name: string) =>
  name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

export default function AdminCourseViewPage() {
  const params = useParams<{ slug: string }>();
  const [course, setCourse] = useState<AdminCourse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return api<{ course: AdminCourse }>(`/courses/${params.slug}`)
      .then((d) => setCourse(d.course))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load course"));
  }, [params.slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <div className="mx-auto max-w-6xl px-4 py-16 text-red-600">{error}</div>;
  if (!course) return <LoadingScreen inline label="Loading course…" />;

  const chapters = course.chapters ?? [];

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
                  {m._count.enrollments} student{m._count.enrollments === 1 ? "" : "s"} enrolled
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-ink-700">Course structure ({chapters.length} chapters)</h2>
        <p className="mt-1 text-sm text-slate-500">
          You own the syllabus: the roadmap, its chapters and the lessons inside them. Mentors then fill each lesson
          with concepts, live class links, recordings and resources — they cannot add or remove chapters and lessons.
        </p>
        <div className="mt-4 rounded-[16px] bg-white p-5 shadow-elev1">
          <CourseRoadmap
            courseId={course.id}
            chapters={chapters}
            roadmap={{
              title: course.roadmapTitle,
              summary: course.roadmapSummary,
              meetingUrl: course.roadmapMeetingUrl,
              recordingUrl: course.roadmapRecordingUrl,
              resources: course.roadmapResources,
            }}
            mode="admin"
            onChanged={() => void load()}
          />
        </div>
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