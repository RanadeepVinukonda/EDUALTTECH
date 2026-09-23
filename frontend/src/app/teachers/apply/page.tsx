"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError, getCachedUser } from "@/lib/api";

interface CourseOption {
  id: string;
  title: string;
  subject: string;
}

interface Application {
  status: string;
  reviewNote: string | null;
  meetingLink: string | null;
  course: { id: string; title: string; slug: string } | null;
}

const STATUS_COPY: Record<string, { heading: string; body: string }> = {
  PENDING: { heading: "Application received", body: "Our team reviews every application manually. You'll hear from us by email." },
  UNDER_REVIEW: { heading: "Under review", body: "An admin is reviewing your application right now." },
  INTERVIEW: { heading: "Interview scheduled", body: "Join the interview using the meeting link below." },
  APPROVED: { heading: "You're approved", body: "You can now build chapters and run your classroom." },
  REJECTED: { heading: "Not this time", body: "Your application was not approved. You can apply again for another course." },
};

export default function MentorApplyPage() {
  const user = getCachedUser();
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [application, setApplication] = useState<Application | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ courseId: "", subject: "", experience: "", qualifications: "", resumeUrl: "", message: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<{ items: CourseOption[] }>("/courses?limit=50")
      .then((d) => setCourses(d.items))
      .catch(() => undefined);

    if (user) {
      api<{ application: Application | null }>("/teachers/me")
        .then((d) => setApplication(d.application))
        .catch(() => undefined)
        .finally(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, [user]);

  function pickCourse(id: string) {
    const course = courses.find((c) => c.id === id);
    setForm((f) => ({ ...f, courseId: id, subject: course?.subject ?? f.subject }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        subject: form.subject,
        experience: Number(form.experience) || 0,
      };
      for (const key of ["courseId", "qualifications", "resumeUrl", "message"] as const) {
        if (form[key].trim()) payload[key] = form[key].trim();
      }

      const data = await api<{ application: Application }>("/teachers/apply", { method: "POST", body: JSON.stringify(payload) });
      setApplication(data.application);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit application");
    } finally {
      setLoading(false);
    }
  }

  if (!loaded) return <div className="mx-auto max-w-2xl px-4 py-20 text-slate-500">Loading…</div>;

  if (!user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900">Mentor a course</h1>
        <p className="mt-3 text-slate-600">Create an account first, then apply to mentor any course.</p>
        <a href="/register" className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
          Create account
        </a>
      </div>
    );
  }

  if (application && application.status !== "REJECTED") {
    const copy = STATUS_COPY[application.status] ?? STATUS_COPY.PENDING;
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{application.status.replace("_", " ")}</p>
          <h1 className="font-display mt-2 text-2xl font-bold text-slate-900">{copy.heading}</h1>
          <p className="mt-3 text-slate-600">{copy.body}</p>
          {application.course && (
            <p className="mt-4 text-sm text-slate-500">
              Course: <span className="font-medium text-slate-700">{application.course.title}</span>
            </p>
          )}
          {application.status === "INTERVIEW" && application.meetingLink && (
            <a
              href={application.meetingLink}
              className="mt-6 inline-block rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
            >
              Join interview
            </a>
          )}
          {application.reviewNote && (
            <p className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">{application.reviewNote}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-slate-900">Mentor a course</h1>
      <p className="mt-2 text-slate-600">
        Anyone here can learn and teach. Pick a course you want to guide, tell us your background, and an admin will review it.
      </p>

      {application?.status === "REJECTED" && (
        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="font-medium text-slate-700">Previous application was not approved.</p>
          {application.reviewNote && <p className="mt-1">{application.reviewNote}</p>}
        </div>
      )}

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-8">
        <div>
          <label htmlFor="course" className="mb-1 block text-sm font-medium text-slate-700">Course you want to mentor</label>
          <select
            id="course"
            required
            value={form.courseId}
            onChange={(e) => pickCourse(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          >
            <option value="" disabled>Select a course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} · {c.subject}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subject" className="mb-1 block text-sm font-medium text-slate-700">Subject</label>
          <input
            id="subject"
            required
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder="e.g. Mathematics"
          />
        </div>

        <div>
          <label htmlFor="experience" className="mb-1 block text-sm font-medium text-slate-700">Years of experience</label>
          <input
            id="experience"
            required
            type="number"
            min={0}
            max={60}
            value={form.experience}
            onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>

        <div>
          <label htmlFor="qualifications" className="mb-1 block text-sm font-medium text-slate-700">Qualifications</label>
          <textarea
            id="qualifications"
            rows={3}
            value={form.qualifications}
            onChange={(e) => setForm((f) => ({ ...f, qualifications: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder="Degrees, certifications, teaching experience"
          />
        </div>

        <div>
          <label htmlFor="resume" className="mb-1 block text-sm font-medium text-slate-700">Resume link (optional)</label>
          <input
            id="resume"
            type="url"
            value={form.resumeUrl}
            onChange={(e) => setForm((f) => ({ ...f, resumeUrl: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder="https://drive.google.com/…"
          />
        </div>

        <div>
          <label htmlFor="message" className="mb-1 block text-sm font-medium text-slate-700">Anything else? (optional)</label>
          <textarea
            id="message"
            rows={3}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !form.courseId}
          className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </div>
  );
}