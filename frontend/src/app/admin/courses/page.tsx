"use client";

import { useCallback, useEffect, useState } from "react";
import { FormEvent } from "react";
import { api, ApiError } from "@/lib/api";

interface CourseRow {
  id: string;
  title: string;
  slug: string;
  subject: string;
  thumbnailUrl: string | null;
  pricePaise: number | null;
  isPublished: boolean;
  teacher: { id: string; name: string; email: string };
  mentors: Array<{
    id: string;
    mentor: { id: string; name: string; email: string };
    _count: { chapters: number; enrollments: number };
  }>;
  _count: { enrollments: number };
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    subject: "",
    gradeLevel: "",
    price: "",
    thumbnailUrl: "",
    isPublished: true,
  });
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  const describeError = (err: unknown): string => {
    if (err instanceof ApiError && err.details && typeof err.details === "object") {
      const d = err.details as { fieldErrors?: Record<string, string[]> };
      const issues = Object.entries(d.fieldErrors ?? {})
        .map(([field, msgs]) => `${field}: ${(msgs ?? []).join(", ")}`)
        .join(" · ");
      if (issues) return `${err.message} — ${issues}`;
    }
    return err instanceof Error ? err.message : "Could not create the course";
  };

  const onThumbnail = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const { thumbnailUrl } = await api<{ thumbnailUrl: string }>("/courses/thumbnail", {
        method: "POST",
        headers: { "Content-Type": file.type, "x-thumbnail-mime": file.type },
        body: file,
      });
      setNewCourse((s) => ({ ...s, thumbnailUrl }));
      setCreateMsg("Thumbnail uploaded.");
    } catch (err) {
      setError(describeError(err));
    } finally {
      setUploading(false);
    }
  };

  const createCourse = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    setError(null);
    try {
      const pricePaise = newCourse.price.trim() === "" ? null : Math.round(parseFloat(newCourse.price) * 100);
      const { course } = await api<{ course: { id: string } }>("/courses", {
        method: "POST",
        body: JSON.stringify({
          title: newCourse.title,
          description: newCourse.description,
          subject: newCourse.subject,
          gradeLevel: newCourse.gradeLevel,
          pricePaise,
          thumbnailUrl: newCourse.thumbnailUrl,
          isPublished: newCourse.isPublished,
        }),
      });
      void course;
      setNewCourse({ title: "", description: "", subject: "", gradeLevel: "", price: "", thumbnailUrl: "", isPublished: true });
      setCreateMsg("Course created. Mentors are added when you approve their application.");
      load();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setCreating(false);
    }
  };

  const load = useCallback(() => {
    api<{ courses: CourseRow[] }>("/admin/courses")
      .then((d) => setCourses(d.courses))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load courses"));
  }, []);

  useEffect(load, [load]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink-700">Courses</h1>
      <p className="mt-1 text-sm text-slate-600">
        Create courses here. Mentors only get attached by approving their mentor application — no manual assignment.
      </p>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {createMsg && <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">{createMsg}</p>}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-ink-700">Create a course</h2>
        <form onSubmit={createCourse} className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            required
            value={newCourse.title}
            onChange={(e) => setNewCourse((s) => ({ ...s, title: e.target.value }))}
            placeholder="Course title"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <input
            required
            value={newCourse.subject}
            onChange={(e) => setNewCourse((s) => ({ ...s, subject: e.target.value }))}
            placeholder="Subject"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <input
            value={newCourse.gradeLevel}
            onChange={(e) => setNewCourse((s) => ({ ...s, gradeLevel: e.target.value }))}
            placeholder="Grade level"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <textarea
            required
            value={newCourse.description}
            onChange={(e) => setNewCourse((s) => ({ ...s, description: e.target.value }))}
            placeholder="What learners will master…"
            rows={2}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 sm:col-span-2"
          />
          <input
            value={newCourse.price}
            onChange={(e) => setNewCourse((s) => ({ ...s, price: e.target.value }))}
            placeholder="Price (₹, e.g. 499 — leave blank for free)"
            inputMode="decimal"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
            {newCourse.thumbnailUrl ? <span className="truncate text-brand-700">Thumbnail uploaded ✓</span> : "Thumbnail (optional)"}
            <span
              role="button"
              onClick={() => { const el = document.getElementById("course-thumb-input") as HTMLInputElement | null; el?.click(); }}
              className="ml-auto shrink-0 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              {uploading ? "Uploading…" : "Choose file"}
            </span>
            <input id="course-thumb-input" type="file" accept="image/*" onChange={onThumbnail} className="hidden" />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={newCourse.isPublished}
              onChange={(e) => setNewCourse((s) => ({ ...s, isPublished: e.target.checked }))}
            />
            Publish immediately
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg brand-grad px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create course"}
            </button>
          </div>
        </form>
      </section>

      {courses.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No courses yet.</p>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <article key={course.id} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-brand-300 hover:shadow-sm">
              {course.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.thumbnailUrl} alt="" className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100">
                  <span className="rounded-xl brand-grad px-3 py-1.5 text-sm font-bold text-white">{course.subject[0]}</span>
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{course.subject}</p>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${course.isPublished ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"}`}>
                    {course.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <h2 className="font-display mt-2 text-lg font-semibold text-slate-900">{course.title}</h2>
                <p className="text-sm text-slate-500">
                  hosted by {course.teacher.name} · {course._count.enrollments} learners
                  {course.pricePaise != null && (
                    <span className="ml-1 font-semibold text-ink-700">· ₹{(course.pricePaise / 100).toLocaleString("en-IN")}</span>
                  )}
                </p>

                <ul className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                  {course.mentors.length === 0 && <li className="text-sm text-slate-400">No mentors yet — they join by applying.</li>}
                  {course.mentors.map((m) => (
                    <li key={m.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span className="truncate text-slate-700">
                        {m.mentor.name} <span className="text-slate-400">· {m.mentor.email}</span>
                      </span>
                      <span className="ml-2 shrink-0 text-xs text-slate-500">
                        {m._count.chapters} ch · {m._count.enrollments} students
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}