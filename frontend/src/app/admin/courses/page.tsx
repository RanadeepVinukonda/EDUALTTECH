"use client";

import { useCallback, useEffect, useState } from "react";
import { FormEvent } from "react";
import { api, ApiError } from "@/lib/api";

interface CourseRow {
  id: string;
  title: string;
  slug: string;
  subject: string;
  isPublished: boolean;
  teacher: { id: string; name: string; email: string };
  mentors: Array<{
    id: string;
    mentor: { id: string; name: string; email: string };
    _count: { chapters: number; enrollments: number };
  }>;
  _count: { enrollments: number };
}

interface MentorOption {
  id: string;
  name: string;
  email: string;
  _count: { mentorships: number };
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [mentors, setMentors] = useState<MentorOption[]>([]);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    subject: "",
    gradeLevel: "",
    thumbnailUrl: "",
    isPublished: true,
  });
  const [creating, setCreating] = useState(false);
  const [createMsg, setCreateMsg] = useState<string | null>(null);

  const createCourse = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateMsg(null);
    setError(null);
    try {
      const { course } = await api<{ course: { id: string } }>("/courses", {
        method: "POST",
        body: JSON.stringify(newCourse),
      });
      void course;
      setNewCourse({ title: "", description: "", subject: "", gradeLevel: "", thumbnailUrl: "", isPublished: true });
      setCreateMsg("Course created.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the course");
    } finally {
      setCreating(false);
    }
  };

  const load = useCallback(() => {
    api<{ courses: CourseRow[] }>("/admin/courses")
      .then((d) => setCourses(d.courses))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load courses"));
    api<{ mentors: MentorOption[] }>("/admin/mentors")
      .then((d) => setMentors(d.mentors))
      .catch(() => undefined);
  }, []);

  useEffect(load, [load]);

  async function assign(courseId: string) {
    const mentorId = picks[courseId];
    if (!mentorId) return;
    setBusy(courseId);
    setError(null);
    try {
      await api(`/admin/courses/${courseId}/mentors`, { method: "POST", body: JSON.stringify({ mentorId }) });
      setPicks((p) => ({ ...p, [courseId]: "" }));
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not assign the mentor");
    } finally {
      setBusy(null);
    }
  }

  async function unassign(courseId: string, mentorId: string) {
    setBusy(courseId);
    setError(null);
    try {
      await api(`/admin/courses/${courseId}/mentors/${mentorId}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove the mentor");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Courses & mentors</h1>
      <p className="mt-1 text-sm text-slate-600">
        A course can have several mentors. Mentors add their own chapters; learners pick who to learn from.
      </p>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {createMsg && <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">{createMsg}</p>}

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-display text-lg font-semibold text-slate-900">Create a course</h2>
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
          <input
            value={newCourse.thumbnailUrl}
            onChange={(e) => setNewCourse((s) => ({ ...s, thumbnailUrl: e.target.value }))}
            placeholder="Thumbnail URL (optional)"
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
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create course"}
            </button>
          </div>
        </form>
      </section>

      {courses.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No courses yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {courses.map((course) => (
            <article key={course.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{course.title}</p>
                  <p className="text-sm text-slate-500">
                    {course.subject} · hosted by {course.teacher.name} · {course._count.enrollments} learners
                  </p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${course.isPublished ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"}`}>
                  {course.isPublished ? "Published" : "Draft"}
                </span>
              </div>

              <ul className="mt-4 space-y-2">
                {course.mentors.length === 0 && <li className="text-sm text-slate-400">No mentors assigned.</li>}
                {course.mentors.map((m) => (
                  <li key={m.id} className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-2 text-sm">
                    <span className="text-slate-700">
                      {m.mentor.name} <span className="text-slate-400">· {m.mentor.email}</span>
                    </span>
                    <span className="flex items-center gap-4">
                      <span className="text-xs text-slate-500">
                        {m._count.chapters} chapters · {m._count.enrollments} learners
                      </span>
                      <button
                        onClick={() => unassign(course.id, m.mentor.id)}
                        disabled={busy === course.id}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-40"
                      >
                        Remove
                      </button>
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-4 flex flex-wrap gap-2">
                <select
                  value={picks[course.id] ?? ""}
                  onChange={(e) => setPicks((p) => ({ ...p, [course.id]: e.target.value }))}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                >
                  <option value="">Assign a mentor…</option>
                  {mentors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.email})
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => assign(course.id)}
                  disabled={busy === course.id || !picks[course.id]}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {busy === course.id ? "Saving…" : "Assign mentor"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}