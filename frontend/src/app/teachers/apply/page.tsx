"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Briefcase, FileText, Upload } from "lucide-react";
import { api, API_BASE, ApiError, getAccessToken, getCachedUser } from "@/lib/api";

interface CourseOption {
  id: string;
  title: string;
  subject: string;
  slug: string;
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

const inputShell =
  "flex h-[50px] items-center rounded-[10px] border-[1.5px] border-slate-200 bg-white px-3 transition focus-within:border-brand-500";
const inputCls = "ml-2 h-full w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400";
const labelCls = "mb-1 block text-sm font-semibold text-slate-800";
const areaCls =
  "w-full rounded-[10px] border-[1.5px] border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 placeholder:text-slate-400";
const RESUME_TYPES = ".pdf,.doc,.docx";

export default function MentorApplyPage() {
  const user = getCachedUser();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [application, setApplication] = useState<Application | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [submitted, setSubmitted] = useState<{ course: string; slug: string } | null>(null);
  const [form, setForm] = useState({ courseId: "", subject: "", experience: "", qualifications: "", message: "" });
  const [resume, setResume] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!submitted?.slug) return;
    const t = setTimeout(() => {
      router.push(`/courses/${submitted.slug}`);
      router.refresh();
    }, 1500);
    return () => clearTimeout(t);
  }, [submitted, router]);

  useEffect(() => {
    api<{ items: CourseOption[] }>("/courses?limit=50")
      .then((d) => {
        setCourses(d.items);
        const slug = new URLSearchParams(window.location.search).get("course");
        const preselected = slug ? d.items.find((c) => c.slug === slug) : undefined;
        if (preselected) {
          setForm((f) => ({ ...f, courseId: preselected.id, subject: preselected.subject }));
        }
      })
      .catch(() => undefined);
  }, []);

  // Applications are per-course: show the one for the selected course
  // (or the most recent when nothing is selected yet).
  useEffect(() => {
    if (!user) {
      setLoaded(true);
      return;
    }
    const courseId = form.courseId;
    api<{ application: Application | null }>(courseId ? `/teachers/me?courseId=${courseId}` : "/teachers/me")
      .then((d) => setApplication(d.application))
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, [user, form.courseId]);

  function pickCourse(id: string) {
    const course = courses.find((c) => c.id === id);
    setForm((f) => ({ ...f, courseId: id, subject: course?.subject ?? f.subject }));
  }

  function pickResume(file: File | null) {
    setError(null);
    if (!file) return setResume(null);
    if (file.size > 5 * 1024 * 1024) return setError("Resume too large — max 5 MB");
    setResume(file);
  }

  // ponytail: raw put; the API helper forces JSON, so this goes direct.
  async function uploadResume(): Promise<string | null> {
    if (!resume) return null;
    setUploading(true);
    try {
      const res = await fetch(`${API_BASE}/teachers/resume`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getAccessToken()}`,
          "Content-Type": "application/octet-stream",
          "x-resume-mime": resume.type || "application/pdf",
        },
        body: resume,
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error?.message ?? "Resume upload failed");
      }
      return json.data.resumeUrl as string;
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: Record<string, unknown> = { subject: form.subject };
      if (form.experience.trim()) payload.experience = Number(form.experience);
      for (const key of ["courseId", "qualifications", "message"] as const) {
        if (form[key].trim()) payload[key] = form[key].trim();
      }
      const resumeUrl = await uploadResume();
      if (resumeUrl) payload.resumeUrl = resumeUrl;

      const data = await api<{ application: Application }>("/teachers/apply", { method: "POST", body: JSON.stringify(payload) });
      setApplication(data.application);
      setResume(null);
      // Show the confirmation, then hand the user to the course they applied for.
      const course = courses.find((c) => c.id === form.courseId);
      setSubmitted({ course: course?.title ?? "the course", slug: course?.slug ?? "" });
    } catch (err) {
      setError(err instanceof ApiError || err instanceof Error ? err.message : "Failed to submit application");
    } finally {
      setLoading(false);
    }
  }

  if (!loaded) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-b from-brand-50 to-white">
        <div className="rounded-[20px] bg-white p-8 text-sm text-slate-500 shadow-elev2">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <Stage>
        <div className="rounded-[20px] bg-white p-8 text-center shadow-elev2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mentor a course</h1>
          <p className="mt-1 text-sm text-slate-600">Create an account first, then apply to mentor any course.</p>
          <a
            href="/register"
            className="mt-6 inline-block rounded-[10px] bg-slate-900 px-6 py-3 text-[15px] font-medium text-white transition hover:bg-slate-800"
          >
            Create account
          </a>
        </div>
      </Stage>
    );
  }

  if (submitted) {
    return (
      <Stage>
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand-600" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
              <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">Application submitted</h1>
          <p className="mt-1 text-sm text-slate-600">
            Your mentor application for <span className="font-semibold text-slate-800">{submitted.course}</span> is pending review.
            You are now on the course page — mentoring and enrollment are locked until an admin reviews it.
          </p>
          <a
            href={`/courses/${submitted.slug}`}
            className="mt-6 inline-block rounded-[10px] bg-slate-900 px-6 py-3 text-[15px] font-medium text-white transition hover:bg-slate-800"
          >
            Go to course
          </a>
        </div>
      </Stage>
    );
  }

  if (application && application.status !== "REJECTED") {
    const copy = STATUS_COPY[application.status] ?? STATUS_COPY.PENDING;
    return (
      <Stage>
        <div className="rounded-[20px] bg-white p-8 text-center shadow-elev2">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{application.status.replace("_", " ")}</p>
          <h1 className="font-display mt-2 text-2xl font-bold text-slate-900">{copy.heading}</h1>
          <p className="mt-1 text-sm text-slate-600">{copy.body}</p>
          {application.course && (
            <p className="mt-4 text-sm text-slate-500">
              Course: <span className="font-medium text-slate-800">{application.course.title}</span>
            </p>
          )}
          {application.status === "INTERVIEW" && application.meetingLink && (
            <a
              href={application.meetingLink}
              className="mt-6 inline-block rounded-[10px] bg-slate-900 px-6 py-3 text-[15px] font-medium text-white transition hover:bg-slate-800"
            >
              Join interview
            </a>
          )}
          {application.reviewNote && (
            <p className="mt-6 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">{application.reviewNote}</p>
          )}
        </div>
      </Stage>
    );
  }

  return (
    <Stage>
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Mentor a course</h1>
      <p className="mt-1 text-sm text-slate-600">
        Pick a course you want to guide and tell us your background. An admin reviews every application.
      </p>

      {application?.status === "REJECTED" && (
        <div className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="font-medium text-slate-700">Previous application was not approved.</p>
          {application.reviewNote && <p className="mt-1">{application.reviewNote}</p>}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="course" className={labelCls}>Course you want to mentor</label>
          <div className={inputShell}>
            <BookOpen className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
            <select
              id="course"
              required
              value={form.courseId}
              onChange={(e) => pickCourse(e.target.value)}
              className={`${inputCls} appearance-none`}
            >
              <option value="" disabled>Select a course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} · {c.subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="subject" className={labelCls}>Subject</label>
          <div className={inputShell}>
            <FileText className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              id="subject"
              required
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              className={inputCls}
              placeholder="e.g. Mathematics"
            />
          </div>
        </div>

        <div>
          <label htmlFor="experience" className={labelCls}>Years of experience (optional)</label>
          <div className={inputShell}>
            <Briefcase className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              id="experience"
              type="number"
              min={0}
              max={60}
              value={form.experience}
              onChange={(e) => setForm((f) => ({ ...f, experience: e.target.value }))}
              className={inputCls}
              placeholder="e.g. 3"
            />
          </div>
        </div>

        <div>
          <label htmlFor="qualifications" className={labelCls}>Qualifications</label>
          <textarea
            id="qualifications"
            rows={3}
            value={form.qualifications}
            onChange={(e) => setForm((f) => ({ ...f, qualifications: e.target.value }))}
            className={areaCls}
            placeholder="Degrees, certifications, teaching experience"
          />
        </div>

        <div>
          <label htmlFor="resume" className={labelCls}>Resume (optional)</label>
          <div className={`${inputShell} h-auto py-1.5`}>
            <Upload className="h-5 w-5 shrink-0 text-slate-400" aria-hidden="true" />
            <input
              id="resume"
              type="file"
              accept={RESUME_TYPES}
              onChange={(e) => pickResume(e.target.files?.[0] ?? null)}
              className="ml-2 h-full w-full min-w-0 text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            />
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            {resume ? (
              <span className="flex items-center justify-between gap-3">
                <span className="truncate text-slate-700">{resume.name}</span>
                <button
                  type="button"
                  onClick={() => setResume(null)}
                  className="shrink-0 font-medium text-slate-500 hover:text-slate-800"
                >
                  Remove
                </button>
              </span>
            ) : (
              "PDF, DOC or DOCX up to 5 MB."
            )}
          </p>
        </div>

        <div>
          <label htmlFor="message" className={labelCls}>Anything else? (optional)</label>
          <textarea
            id="message"
            rows={3}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className={areaCls}
            placeholder="How you plan to teach, availability, anything useful"
          />
        </div>

        <button
          type="submit"
          disabled={loading || uploading || !form.courseId}
          className="w-full rounded-[10px] bg-slate-900 py-3 text-[15px] font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {uploading ? "Uploading resume…" : loading ? "Submitting…" : "Submit application"}
        </button>
      </form>
    </Stage>
  );
}

/** Same centred gradient stage the login / register cards sit on. */
function Stage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] justify-center bg-gradient-to-b from-brand-50 to-white px-4 py-12">
      <div className="w-full max-w-md rounded-[20px] bg-white p-8 shadow-elev2">{children}</div>
    </div>
  );
}
