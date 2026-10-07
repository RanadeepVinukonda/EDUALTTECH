"use client";

import { useCallback, useEffect, useState } from "react";
import { FormEvent } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import LoadingScreen from "@/components/ui/LoadingScreen";

interface CourseRow {
  id: string;
  title: string;
  slug: string;
  subject: string;
  thumbnailUrl: string | null;
  isPublished: boolean;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    subject: "",
    price: "",
    thumbnailUrl: "",
  });
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
          pricePaise,
          thumbnailUrl: newCourse.thumbnailUrl,
        }),
      });
      void course;
      setNewCourse({ title: "", description: "", subject: "", price: "", thumbnailUrl: "" });
      setCreateMsg("Course created as a draft — add chapters, then publish it from its page.");
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
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load courses"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const deleteCourse = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeletingId(id);
    setError(null);
    try {
      await api(`/admin/courses/${id}`, { method: "DELETE" });
      setCreateMsg("Course deleted.");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not delete the course");
    } finally {
      setDeletingId(null);
    }
  };

  const set = (k: keyof typeof newCourse) => (v: string) => setNewCourse((s) => ({ ...s, [k]: v }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink-700">Courses</h1>
      <p className="mt-1 text-sm text-slate-600">
        Create courses here. Mentors only get attached by approving their mentor application — no manual assignment.
      </p>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {createMsg && <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">{createMsg}</p>}

      <section className="mt-6 rounded-[20px] bg-white p-6 shadow-elev2 sm:p-8">
        <h2 className="font-display text-lg font-bold text-ink-700">Create a course</h2>
        <form onSubmit={createCourse} className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field
            label="Course title"
            className="sm:col-span-2"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          >
            <input
              required
              value={newCourse.title}
              onChange={(e) => set("title")(e.target.value)}
              placeholder="e.g. Algebra Foundations for Class 8"
              className="h-full w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </Field>

          <Field
            label="Subject"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.47c.54.4.8 1.1.8 1.8V16a2 2 0 0 0 2 2h2.4a2 2 0 0 0 2-2v-.72c0-.7.26-1.41.8-1.8A6 6 0 0 0 12 3z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          >
            <input
              required
              value={newCourse.subject}
              onChange={(e) => set("subject")(e.target.value)}
              placeholder="e.g. Mathematics"
              className="h-full w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </Field>

          <Field
            label="Price (₹)"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M6 3h12M6 8h12M6 13l8.5 8M6 13c2.2 0 4-1.6 4-3.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 13c2.2 0 4 1.6 4 3.5" strokeLinecap="round" />
              </svg>
            }
          >
            <input
              value={newCourse.price}
              onChange={(e) => set("price")(e.target.value)}
              placeholder="499 — leave blank for free"
              inputMode="decimal"
              className="h-full w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </Field>

          <Field
            label="What learners will master"
            className="sm:col-span-2"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          >
            <textarea
              required
              value={newCourse.description}
              onChange={(e) => set("description")(e.target.value)}
              placeholder="Skills, outcomes and who it's for…"
              rows={2}
              className="h-full w-full resize-none bg-transparent pt-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </Field>

          <label className="group flex min-h-[96px] cursor-pointer items-center gap-4 rounded-[10px] border-[1.5px] border-dashed border-slate-300 p-4 transition hover:border-brand-400 hover:bg-brand-50/30">
            {newCourse.thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={newCourse.thumbnailUrl} alt="" className="h-16 w-24 shrink-0 rounded-[8px] object-cover" />
            ) : (
              <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded-[8px] bg-slate-100 text-slate-400 group-hover:bg-brand-100/60 group-hover:text-brand-600">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-700">
                {uploading ? "Uploading…" : newCourse.thumbnailUrl ? "Thumbnail uploaded — click to change" : "Course thumbnail"}
              </span>
              <span className="block text-xs text-slate-400">JPG / PNG, drag anywhere to click</span>
            </span>
            <input id="course-thumb-input" type="file" accept="image/*" onChange={onThumbnail} className="hidden" />
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating || uploading}
              className="flex h-[50px] items-center justify-center gap-2 rounded-[10px] bg-slate-900 px-6 text-[15px] font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
              </svg>
              {creating ? "Creating…" : "Create course"}
            </button>
          </div>
        </form>
      </section>

      {loading ? (
        <LoadingScreen inline label="Loading courses…" />
      ) : courses.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No courses yet.
        </div>
      ) : (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <article key={course.id} className="group flex flex-col overflow-hidden rounded-[20px] bg-white shadow-elev2 transition hover:-translate-y-1 hover:shadow-elev3">
              {course.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={course.thumbnailUrl} alt="" className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-xl font-bold text-brand-700 shadow-sm">
                    {course.subject[0]?.toUpperCase()}
                  </span>
                </div>
              )}
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">{course.subject}</span>
                  <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${course.isPublished ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${course.isPublished ? "bg-brand-500" : "bg-amber-500"}`} />
                    {course.isPublished ? "Published" : "Draft"}
                  </span>
                </div>
                <h2 className="font-display mb-4 mt-2 text-lg font-bold text-slate-900">{course.title}</h2>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                  <Link
                    href={`/admin/courses/view/${course.slug}`}
                    title="View course"
                    aria-label="View course"
                    className="btn-view"
                  >
                    <svg viewBox="0 0 24 24" className="svgIcon" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </Link>
                  <button
                    type="button"
                    onClick={() => deleteCourse(course.id, course.title)}
                    disabled={deletingId === course.id}
                    title="Delete course"
                    aria-label="Delete course"
                    className={`btn-trash ${deletingId === course.id ? "is-busy" : ""}`}
                  >
                    <svg viewBox="0 0 448 512" className="svgIcon" aria-hidden="true">
                      <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  icon,
  children,
  className = "",
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="flex h-[50px] items-center rounded-[10px] border-[1.5px] border-slate-200 px-3 transition focus-within:border-brand-500">
        {icon}
        <span className="ml-2 min-w-0 flex-1">{children}</span>
      </span>
    </label>
  );
}