"use client";

import { useState } from "react";
import Link from "next/link";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import type { Application, ApplicationStatus } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import { notifySuccess, notifyError } from "@/lib/notify";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { AdminHeader, ConfirmDialog, Panel, Skeleton, StatusPill, statusTone, useAsync, userName } from "./admin-ui";

type Decision = "UNDER_REVIEW" | "INTERVIEW_SCHEDULED" | "ACCEPTED" | "REJECTED";

// Mirrors the backend state machine for UI affordance only — the server is authoritative.
const TRANSITIONS: Record<ApplicationStatus, Decision[]> = {
  SUBMITTED: ["UNDER_REVIEW", "INTERVIEW_SCHEDULED", "REJECTED"],
  UNDER_REVIEW: ["INTERVIEW_SCHEDULED", "ACCEPTED", "REJECTED"],
  INTERVIEW_SCHEDULED: ["ACCEPTED", "REJECTED"],
  ACCEPTED: [],
  REJECTED: [],
};

const LABEL: Record<Decision, string> = {
  UNDER_REVIEW: "Move to under review",
  INTERVIEW_SCHEDULED: "Schedule interview",
  ACCEPTED: "Accept as mentor",
  REJECTED: "Reject application",
};

const CONSEQUENCE: Record<Decision, string> = {
  UNDER_REVIEW: "Marks the application as being reviewed. No teaching access is granted.",
  INTERVIEW_SCHEDULED: "Records an interview for this applicant. No teaching access is granted.",
  ACCEPTED:
    "Creates an ACTIVE MENTOR participation for this applicant in THIS course only. It grants no global role. This also fails if the user already participates in the course.",
  REJECTED: "Rejects the application. This is terminal and cannot be undone.",
};

export default function AdminApplicationReview({ id }: { id: string }) {
  const app = useAsync(() => apiGet<{ application: Application }>(`/applications/${id}`), [id]);
  const [current, setCurrent] = useState<Application | null>(null);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState("");
  const [interviewUrl, setInterviewUrl] = useState("");
  const [interviewAt, setInterviewAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [resumeBusy, setResumeBusy] = useState(false);

  const application = current ?? app.data?.application ?? null;

  async function submit() {
    if (!decision || !application) return;
    setBusy(true);
    try {
      const res = await apiPost<{ application: Application }>(`/applications/${application.id}/review`, {
        action: decision,
        note: note.trim() || undefined,
        ...(decision === "INTERVIEW_SCHEDULED"
          ? {
              interviewUrl: interviewUrl.trim() || undefined,
              interviewAt: interviewAt ? new Date(interviewAt).toISOString() : undefined,
            }
          : {}),
      });
      setCurrent(res.application);
      notifySuccess(`Application ${decision.replace(/_/g, " ").toLowerCase()}`);
      setDecision(null);
      setNote("");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Could not update the application";
      notifyError(msg);
    } finally {
      setBusy(false);
    }
  }

  async function openResume() {
    if (!application) return;
    setResumeBusy(true);
    try {
      const { url } = await apiGet<{ url: string }>(`/applications/${application.id}/resume`);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      notifyError(e instanceof ApiError ? e.message : "Could not open the resume");
    } finally {
      setResumeBusy(false);
    }
  }

  if (app.error) return <ErrorState message={app.error} onRetry={app.reload} />;
  if (app.loading && !application) return <Skeleton className="h-96 rounded-[20px]" />;
  if (!application) return <EmptyState title="Application not found" description="This application may have been removed." />;

  const next = TRANSITIONS[application.status];

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Application review"
        description="Read the applicant's submission, then apply one of the backend-supported decisions."
        actions={
          <Link href="/dashboard/admin/applications" className="text-sm font-semibold text-brand-700 hover:underline">
            ← Back to queue
          </Link>
        }
      />

      <Panel title="Applicant">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" value={userName(application.user)} />
          <Field label="Email" value={application.user?.email ?? "—"} />
          <Field label="Mobile" value={application.user?.mobile ?? "—"} />
          <Field label="Course" value={application.course.title} />
          <Field label="Status" value={<StatusPill tone={statusTone(application.status)}>{application.status.replace(/_/g, " ").toLowerCase()}</StatusPill>} />
          <Field label="Submitted" value={formatDate(application.createdAt)} />
        </dl>
      </Panel>

      <Panel title="Submission">
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Qualification</p>
            <p className="mt-1 whitespace-pre-wrap text-[15px] text-ink-900">{application.qualification}</p>
          </div>
          {application.message && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</p>
              <p className="mt-1 whitespace-pre-wrap text-[15px] text-ink-900">{application.message}</p>
            </div>
          )}
          {application.resumePath && (
            <Button size="sm" variant="secondary" loading={resumeBusy} onClick={openResume}>
              Open resume
            </Button>
          )}
        </div>
      </Panel>

      {(application.interviewAt || application.interviewUrl || application.reviewNote) && (
        <Panel title="Review history">
          <dl className="grid gap-4 sm:grid-cols-2">
            {application.interviewAt && <Field label="Interview at" value={formatDate(application.interviewAt)} />}
            {application.interviewUrl && (
              <Field
                label="Interview link"
                value={
                  <a href={application.interviewUrl} target="_blank" rel="noopener noreferrer" className="break-all text-brand-700 hover:underline">
                    {application.interviewUrl}
                  </a>
                }
              />
            )}
            {application.reviewedAt && <Field label="Reviewed at" value={formatDate(application.reviewedAt)} />}
            {application.reviewNote && <Field label="Note" value={application.reviewNote} />}
          </dl>
        </Panel>
      )}

      <Panel title="Decision" description="Only transitions permitted by the backend state machine are offered.">
        {next.length === 0 ? (
          <p className="text-sm text-slate-500">This application is in a terminal state ({application.status.toLowerCase()}). No further decisions are available.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {next.map((action) => (
                <Button
                  key={action}
                  size="sm"
                  variant={action === "REJECTED" ? "danger" : action === "ACCEPTED" ? "primary" : "secondary"}
                  onClick={() => {
                    setNote(application.reviewNote ?? "");
                    setInterviewUrl(application.interviewUrl ?? "");
                    setInterviewAt(application.interviewAt ? application.interviewAt.slice(0, 16) : "");
                    setDecision(action);
                  }}
                >
                  {LABEL[action]}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Panel>

      <ConfirmDialog
        open={decision !== null}
        title={decision ? LABEL[decision] : ""}
        confirmLabel={decision ? LABEL[decision] : "Confirm"}
        tone={decision === "REJECTED" ? "danger" : "primary"}
        busy={busy}
        onClose={() => !busy && setDecision(null)}
        onConfirm={submit}
      >
        <p>{decision ? CONSEQUENCE[decision] : ""}</p>
        {decision === "INTERVIEW_SCHEDULED" && (
          <div className="mt-3 space-y-2">
            <label htmlFor="iv-url" className="block text-sm font-semibold text-ink-900">Interview link (optional)</label>
            <input
              id="iv-url"
              type="url"
              value={interviewUrl}
              onChange={(e) => setInterviewUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
            <label htmlFor="iv-at" className="block text-sm font-semibold text-ink-900">Interview time (optional)</label>
            <input
              id="iv-at"
              type="datetime-local"
              value={interviewAt}
              onChange={(e) => setInterviewAt(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
        )}
        <div className="mt-3">
          <label htmlFor="rv-note" className="block text-sm font-semibold text-ink-900">Review note (optional)</label>
          <textarea
            id="rv-note"
            rows={3}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-[15px] text-ink-900">{value}</dd>
    </div>
  );
}
