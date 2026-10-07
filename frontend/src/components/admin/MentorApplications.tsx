"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import LoadingScreen from "@/components/ui/LoadingScreen";

export type ApplicationStatus = "PENDING" | "UNDER_REVIEW" | "INTERVIEW" | "APPROVED" | "REJECTED";

export interface MentorApplication {
  id: string;
  status: ApplicationStatus;
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
  course: { id: string; title: string; slug: string; thumbnailUrl: string | null } | null;
}

// Mirrors backend APPLICATION_TRANSITIONS (lib/invariants.ts) — the server
// rejects anything else even if a stale tab renders an old button.
const NEXT: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  PENDING: ["UNDER_REVIEW", "INTERVIEW", "APPROVED", "REJECTED"],
  UNDER_REVIEW: ["INTERVIEW", "APPROVED", "REJECTED"],
  INTERVIEW: ["APPROVED", "REJECTED"],
  APPROVED: [],
  REJECTED: [],
};

const BADGE: Record<ApplicationStatus, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  UNDER_REVIEW: "bg-violet-50 text-violet-700",
  INTERVIEW: "bg-brand-50 text-brand-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-600",
};

/**
 * Mentor applications live inside the course folder: pass courseId to scope them
 * to one course, omit it for the all-courses view. Review (interview link,
 * approve, reject) happens here either way.
 */
export function MentorApplications({ courseId }: { courseId?: string }) {
  const [applications, setApplications] = useState<MentorApplication[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [links, setLinks] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    api<{ applications: MentorApplication[] }>("/teachers/applications")
      .then((d) =>
        setApplications(courseId ? d.applications.filter((a) => a.course?.id === courseId) : d.applications),
      )
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [courseId]);

  useEffect(load, [load]);

  async function review(app: MentorApplication, status: ApplicationStatus) {
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

  if (loading) return <LoadingScreen inline label="Loading applications…" />;

  if (applications.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        No mentor applications for this course yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {applications.map((app) => (
        <ApplicationCard
          key={app.id}
          app={app}
          note={notes[app.id] ?? ""}
          link={links[app.id] ?? app.meetingLink ?? ""}
          busy={busyId === app.id}
          onNote={(v) => setNotes((n) => ({ ...n, [app.id]: v }))}
          onLink={(v) => setLinks((l) => ({ ...l, [app.id]: v }))}
          onReview={(s) => review(app, s)}
        />
      ))}
    </div>
  );
}

function ApplicationCard({
  app,
  note,
  link,
  busy,
  onNote,
  onLink,
  onReview,
}: {
  app: MentorApplication;
  note: string;
  link: string;
  busy: boolean;
  onNote: (v: string) => void;
  onLink: (v: string) => void;
  onReview: (s: ApplicationStatus) => void;
}) {
  const initials = app.user.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <article className="rounded-[20px] bg-white p-6 shadow-elev2 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
            {initials}
          </span>
          <div>
            <p className="font-display text-lg font-bold text-slate-900">{app.user.name}</p>
            <p className="text-sm text-slate-500">
              {app.user.email}
              {app.user.schoolName ? ` · ${app.user.schoolName}` : ""}
            </p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${BADGE[app.status]}`}>
          {app.status.replace("_", " ")}
        </span>
      </div>

      <dl className="mt-5 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        <Row label="Subject" value={app.subject} />
        <Row label="Experience" value={`${app.experience} year(s)`} />
        <Row label="Education" value={app.education ?? "—"} />
        <Row label="Qualifications" value={app.qualifications ?? "—"} />
        <Row
          label="Resume"
          value={
            app.resumeUrl ? (
              <a
                href={app.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-slate-200 px-3 py-1.5 font-medium text-slate-700 transition hover:border-brand-400 hover:text-brand-700"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View resume
              </a>
            ) : (
              "—"
            )
          }
        />
        {app.reviewNote && <Row label="Review note" value={app.reviewNote} />}
      </dl>
      {app.message && (
        <div className="mt-4 rounded-[10px] border-[1.5px] border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {app.message}
        </div>
      )}

      <div className="mt-5 space-y-3">
        <div className="flex h-[50px] items-center rounded-[10px] border-[1.5px] border-slate-200 px-3 transition focus-within:border-brand-500">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M14 3v4a1 1 0 0 0 1 1h4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M9 13h6M9 17h4" strokeLinecap="round" />
          </svg>
          <input
            placeholder="Note (sent to the applicant)"
            value={note}
            onChange={(e) => onNote(e.target.value)}
            className="ml-2 h-full w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex flex-wrap items-stretch gap-3">
          <div className="flex h-[50px] min-w-0 flex-1 items-center rounded-[10px] border-[1.5px] border-slate-200 px-3 transition focus-within:border-brand-500">
            <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <input
              type="url"
              placeholder="Interview meeting link"
              value={link}
              onChange={(e) => onLink(e.target.value)}
              className="ml-2 h-full w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
          <button
            type="button"
            onClick={() => onReview("INTERVIEW")}
            disabled={busy || app.status === "INTERVIEW" || !NEXT[app.status].includes("INTERVIEW")}
            className={`btn-apply shrink-0 disabled:cursor-not-allowed disabled:opacity-40 ${app.status === "INTERVIEW" ? "ring-2 ring-ink-300" : ""}`}
            title="Move to interview with the meeting link above"
          >
            {busy ? "Working…" : app.status === "INTERVIEW" ? "Interview" : "Schedule interview"}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {NEXT[app.status].filter((s) => s !== "INTERVIEW").map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onReview(status)}
            disabled={busy || app.status === status}
            className={`h-[50px] rounded-[10px] px-5 text-[15px] font-medium transition disabled:cursor-not-allowed disabled:opacity-40 ${
              status === "APPROVED"
                ? "bg-slate-900 text-white hover:bg-slate-800"
                : status === "REJECTED"
                  ? "border-[1.5px] border-red-300 bg-white text-red-600 hover:bg-red-50"
                  : "border-[1.5px] border-slate-200 bg-white text-slate-700 hover:border-brand-400 hover:text-brand-700"
            }`}
          >
            {status.replace("_", " ")}
          </button>
        ))}
        {NEXT[app.status].length === 0 && (
          <p className="text-sm font-medium text-slate-500">
            {app.status === "APPROVED"
              ? "Approved — their mentor seat lives on the course page."
              : "Rejected — they can apply again."}
          </p>
        )}
      </div>
    </article>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-slate-400">{label}</dt>
      <dd className="text-slate-700">{value}</dd>
    </div>
  );
}