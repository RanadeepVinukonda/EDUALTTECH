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

const BADGE: Record<Application["status"], string> = {
  PENDING: "bg-amber-50 text-amber-700",
  UNDER_REVIEW: "bg-violet-50 text-violet-700",
  INTERVIEW: "bg-brand-50 text-brand-700",
  APPROVED: "bg-emerald-50 text-emerald-700",
  REJECTED: "bg-red-50 text-red-600",
};

const FILE_COLOR: Record<Application["status"], string> = {
  PENDING: "#f59e0b",
  UNDER_REVIEW: "#8b5cf6",
  INTERVIEW: "#3b82f6",
  APPROVED: "#10b981",
  REJECTED: "#f43f5e",
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [links, setLinks] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [query, setQuery] = useState<Record<string, string>>({});

  const folders = useCallback(() => {
    const map = new Map<string, { title: string; apps: Application[] }>();
    for (const app of applications) {
      const key = app.course?.title ?? "Unassigned course";
      const f = map.get(key) ?? { title: key, apps: [] };
      f.apps.push(app);
      map.set(key, f);
    }
    return [...map.values()];
  }, [applications]);

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
        Open a course folder to review its applications, schedule an interview, or approve the mentor.
      </p>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {applications.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No applications yet.
        </div>
      ) : (
        <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {folders().map((folder) => {
            const key = folder.title;
            const isOpen = open[key] ?? false;
            const q = (query[key] ?? "").toLowerCase();
            const matched = folder.apps.filter(
              (a) =>
                a.user.name.toLowerCase().includes(q) ||
                a.user.email.toLowerCase().includes(q) ||
                a.subject.toLowerCase().includes(q)
            );
            const files = folder.apps.slice(0, 5);
            return (
              <div key={key} className="flex min-w-0 flex-col items-center">
                <label className="eat-folder-card">
                  <input
                    type="checkbox"
                    className="eat-folder-toggle"
                    checked={isOpen}
                    onChange={() => setOpen((o) => ({ ...o, [key]: !isOpen }))}
                  />
                  <span className="eat-hint-wrapper" aria-hidden="true">
                    <span className="eat-hint-text">Click to open</span>
                    <svg className="eat-hint-arrow" viewBox="0 0 40 40" fill="none">
                      <path d="M 35 5 C 35 5, 15 5, 10 25 M 10 25 L 3 18 M 10 25 L 18 22" stroke="#60a5fa" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>

                  <div className="eat-folder-container">
                    <svg className="eat-folder-back" viewBox="0 0 50 40" fill="none" aria-hidden="true">
                      <path d="M0 4C0 1.79086 1.79086 0 4 0H16.524C17.721 0 18.8415 0.54051 19.574 1.4673L22.426 5.0654C23.1585 5.99219 24.279 6.5327 25.476 6.5327H46C48.2091 6.5327 50 8.32356 50 10.5327V36C50 38.2091 48.2091 40 46 40H4C1.79086 40 0 38.2091 0 36V4Z" fill="#024059" />
                    </svg>

                    <div className="eat-folder-search">
                      <svg className="eat-search-icon" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} aria-hidden="true">
                        <circle cx={11} cy={11} r={8} />
                        <line x1={21} y1={21} x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Search applicants…"
                        className="eat-search-input"
                        value={query[key] ?? ""}
                        onChange={(e) => setQuery((x) => ({ ...x, [key]: e.target.value }))}
                      />
                    </div>

                    {files.map((app, i) => {
                      const isMore = i === 4 && folder.apps.length > 5;
                      const cls = `eat-file eat-file-${i + 1}`;
                      if (isMore) {
                        return (
                          <div key={app.id} className={cls} style={{ background: "#024059" }}>
                            <div className="eat-file-shine" />
                            <div className="eat-file-text">+{folder.apps.length - 4} more</div>
                            <div className="eat-file-tag">applications</div>
                          </div>
                        );
                      }
                      return (
                        <div key={app.id} className={cls} style={{ background: FILE_COLOR[app.status] }}>
                          <div className="eat-file-shine" />
                          <svg className="eat-file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                            <circle cx={12} cy={8} r={4} />
                            <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                          </svg>
                          <div className="eat-file-text">{app.user.name}</div>
                          <div className="eat-file-tag">{app.status.replace("_", " ")}</div>
                        </div>
                      );
                    })}

                    <div className="eat-folder-front-wrapper">
                      <svg className="eat-folder-front" viewBox="0 0 50 34" fill="none" aria-hidden="true">
                        <path d="M0 4C0 1.79086 1.79086 0 4 0H46C48.2091 0 50 1.79086 50 4V30C50 32.2091 48.2091 34 46 34H4C1.79086 34 0 32.2091 0 30V4Z" fill="rgba(3, 140, 62, 0.65)" />
                      </svg>
                      <div className="eat-folder-label" />
                      <div className="eat-counter" title={`${folder.apps.length} application${folder.apps.length === 1 ? "" : "s"}`}>
                        <div className="eat-status-dot" />
                        <span className="eat-counter-label">Apps</span>
                        <span className="eat-counter-number">{String(folder.apps.length).padStart(2, "0")}</span>
                      </div>
                    </div>
                  </div>
                </label>

                {isOpen && (
                  <div className="mt-6 w-full space-y-4">
                    <p className="text-center font-display text-base font-bold text-ink-700">{folder.title}</p>
                    {matched.length === 0 ? (
                      <p className="rounded-[10px] bg-white px-4 py-3 text-center text-sm text-slate-500 shadow-elev2">
                        No matching applications.
                      </p>
                    ) : (
                      matched.map((app) => (
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
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
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
  app: Application;
  note: string;
  link: string;
  busy: boolean;
  onNote: (v: string) => void;
  onLink: (v: string) => void;
  onReview: (s: (typeof STATUSES)[number]) => void;
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
            disabled={busy || app.status === "INTERVIEW"}
            className={`btn-apply shrink-0 disabled:cursor-not-allowed disabled:opacity-40 ${app.status === "INTERVIEW" ? "ring-2 ring-ink-300" : ""}`}
            title="Move to interview with the meeting link above"
          >
            <div aria-hidden="true">
              <div className="pencil" />
              <div className="folder">
                <div className="top">
                  <svg viewBox="0 0 24 27">
                    <path d="M1,0 L23,0 C23.5522847,-1.01453063e-16 24,0.44771525 24,1 L24,8.17157288 C24,8.70200585 23.7892863,9.21071368 23.4142136,9.58578644 L20.5857864,12.4142136 C20.2107137,12.7892863 20,13.2979941 20,13.8284271 L20,26 C20,26.5522847 19.5522847,27 19,27 L1,27 C0.44771525,27 6.76353751e-17,26.5522847 0,26 L0,1 C-6.76353751e-17,0.44771525 0.44771525,1.01453063e-16 1,0 Z" />
                  </svg>
                </div>
                <div className="paper" />
              </div>
            </div>
            {busy ? "Working…" : app.status === "INTERVIEW" ? "Interview" : "Schedule interview"}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {STATUSES.filter((s) => s !== "INTERVIEW").map((status) => (
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
      </div>
    </article>
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