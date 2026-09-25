"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface Application {
  id: string;
  status: "PENDING" | "UNDER_REVIEW" | "INTERVIEW" | "APPROVED" | "REJECTED";
  subject: string;
  experience: number;
  education: string | null;
  qualifications: string | null;
  resumeUrl: string | null;
  message: string | null;
  meetingLink: string | null;
  reviewNote: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string; schoolName: string | null };
  course: { id: string; title: string; slug: string } | null;
}

const STATUSES = ["UNDER_REVIEW", "INTERVIEW", "APPROVED", "REJECTED"] as const;

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [links, setLinks] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ applications: Application[] }>("/teachers/applications")
      .then((d) => setApplications(d.applications))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, []);

  useEffect(load, [load]);

  async function review(app: Application, status: (typeof STATUSES)[number]) {
    setBusyId(app.id);
    setError(null);
    try {
      const meetingLink = links[app.id] ?? app.meetingLink ?? "";
      await api(`/teachers/applications/${app.id}/review`, {
        method: "POST",
        body: JSON.stringify({
          status,
          ...(notes[app.id] ? { reviewNote: notes[app.id] } : {}),
          ...(meetingLink ? { meetingLink } : {}),
        }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the review");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink-700">Mentor applications</h1>
      <p className="mt-1 text-sm text-slate-600">
        Review each application, schedule an interview, then approve to attach the mentor to their course.
      </p>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {applications.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
          No applications yet.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {applications.map((app) => (
            <article key={app.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{app.user.name}</p>
                  <p className="text-sm text-slate-500">
                    {app.user.email}
                    {app.user.schoolName ? ` · ${app.user.schoolName}` : ""}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {app.status.replace("_", " ")}
                </span>
              </div>

              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <Row label="Course" value={app.course?.title ?? "Not specified"} />
                <Row label="Subject" value={app.subject} />
                <Row label="Experience" value={`${app.experience} year(s)`} />
                <Row label="Education" value={app.education ?? "—"} />
                <Row label="Qualifications" value={app.qualifications ?? "—"} />
                <Row
                  label="Resume"
                  value={app.resumeUrl ? <a className="font-medium text-brand-700 hover:text-brand-800" href={app.resumeUrl}>Open link</a> : "—"}
                />
              </dl>
              {app.message && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">{app.message}</p>}

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <input
                  placeholder="Note (sent to the applicant)"
                  value={notes[app.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [app.id]: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
                <input
                  type="url"
                  placeholder="Interview meeting link"
                  value={links[app.id] ?? app.meetingLink ?? ""}
                  onChange={(e) => setLinks((l) => ({ ...l, [app.id]: e.target.value }))}
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {STATUSES.map((status) => (
                  <button
                    key={status}
                    onClick={() => review(app, status)}
                    disabled={busyId === app.id || app.status === status}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-40 ${
                      status === "APPROVED"
                        ? "brand-grad text-white hover:bg-brand-700"
                        : status === "REJECTED"
                          ? "border border-red-300 text-red-600 hover:bg-red-50"
                          : "border border-slate-300 text-slate-700 hover:border-brand-400 hover:text-brand-700"
                    }`}
                  >
                    {status.replace("_", " ")}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-slate-400">{label}</dt>
      <dd className="text-slate-700">{value}</dd>
    </div>
  );
}