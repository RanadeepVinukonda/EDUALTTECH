"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, ApiError } from "@/lib/api";
import type { Application } from "@/lib/app-types";
import { APPLICATION_STATUS_META } from "@/lib/mentor";
import { formatDate, formatCountdown } from "@/lib/format";
import { notifyError } from "@/lib/notify";
import { buttonClass } from "@/components/ui/Button";
import FlipClock from "@/components/ui/FlipClock";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";

export default function ApplicationDetailView({ id }: { id: string }) {
  const [application, setApplication] = useState<Application | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!application?.interviewAt) return;
    const end = new Date(application.interviewAt).getTime() + 60 * 60_000;
    const t = setInterval(() => {
      const tick = Date.now();
      setNow(tick);
      if (tick >= end) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [application?.interviewAt]);

  const load = useCallback(async () => {
    setError(null);
    setNotFound(false);
    try {
      const { application } = await apiGet<{ application: Application }>(`/applications/${id}`);
      setApplication(application);
    } catch (e) {
      if (e instanceof ApiError && (e.code === "NOT_FOUND" || e.status === 404)) setNotFound(true);
      else setError(e instanceof Error ? e.message : "Could not load this application.");
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function downloadResume() {
    if (downloading) return;
    // Open synchronously (user gesture) then point it at the signed URL once fetched.
    const tab = window.open("", "_blank");
    setDownloading(true);
    try {
      const { url } = await apiGet<{ url: string }>(`/applications/${id}/resume`);
      if (tab) tab.location.href = url;
      else window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      tab?.close();
      notifyError(e instanceof Error ? e.message : "Could not open the resume.");
    } finally {
      setDownloading(false);
    }
  }

  if (notFound)
    return (
      <EmptyState
        title="Application not found"
        description="This application doesn't exist or isn't yours."
        action={
          <Link href="/dashboard/mentor" className={buttonClass("secondary", "sm")}>
            Back to mentor area
          </Link>
        }
      />
    );
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!application) return <Spinner label="Loading application…" />;

  const meta = APPLICATION_STATUS_META[application.status];

  const interviewStart = application.interviewAt ? new Date(application.interviewAt).getTime() : 0;
  // ponytail: no stored interview duration — treat the first 60 minutes as live.
  const interviewStatus = !interviewStart
    ? null
    : now < interviewStart
      ? `Starts in ${formatCountdown(interviewStart - now)}`
      : now < interviewStart + 60 * 60_000
        ? "Live now"
        : "Ended";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <nav aria-label="Breadcrumb" className="text-xs font-medium text-slate-500">
        <Link href="/dashboard/mentor" className="hover:text-ink-700">
          Mentor
        </Link>
        <span aria-hidden> / </span>
        <span aria-current="page" className="text-ink-800">Application</span>
      </nav>

      <header className="border-b border-slate-200 pb-5">
        <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-900">{application.course.title}</h1>
        <p className="mt-1 text-sm text-slate-600">Mentor application</p>
      </header>

      <section className="rounded-lg border border-slate-200 bg-paper p-5">
        <p className="text-xs font-semibold text-slate-600">Application status</p>
        <p className={`mt-1 font-display text-lg font-semibold ${meta.tone}`}>{meta.label}</p>
        <p className="mt-2 text-sm text-slate-600">{meta.next}</p>
      </section>

      {application.status === "INTERVIEW_SCHEDULED" && (application.interviewAt || application.interviewUrl) && (
        <section className="rounded-lg border border-brand-200 bg-brand-50/60 p-5 text-sm">
          <h2 className="font-display font-semibold text-brand-900">Interview details</h2>
          {application.interviewAt && (
            <p className="mt-2 text-brand-900">Scheduled for {formatDate(application.interviewAt)}</p>
          )}
          {(application.interviewUrl || interviewStatus) && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {application.interviewUrl && (
                <a
                  href={application.interviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("primary", "sm")}
                >
                  Join interview
                </a>
              )}
              {interviewStart > now && application.interviewAt ? (
                <FlipClock to={application.interviewAt} label="Starts in" />
              ) : (
                interviewStatus && (
                  <span
                    className={
                      interviewStatus === "Live now"
                        ? "font-semibold text-green-700"
                        : "font-semibold text-brand-800"
                    }
                  >
                    {interviewStatus}
                  </span>
                )
              )}
            </div>
          )}
        </section>
      )}

      <dl className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-paper p-5 text-sm">
        <div>
          <dt className="font-semibold text-ink-700">Reference</dt>
          <dd className="mt-0.5 font-mono text-slate-600">{application.id}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink-700">Course</dt>
          <dd className="mt-0.5 text-slate-600">
            {application.course.title} · {application.course.category}
          </dd>
        </div>
        <div>
          <dt className="font-semibold text-ink-700">Submitted</dt>
          <dd className="mt-0.5 text-slate-600">{formatDate(application.createdAt)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-ink-700">Qualification</dt>
          <dd className="mt-0.5 whitespace-pre-wrap text-slate-600">{application.qualification}</dd>
        </div>
        {application.message && (
          <div>
            <dt className="font-semibold text-ink-700">Message</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-slate-600">{application.message}</dd>
          </div>
        )}
        <div>
          <dt className="font-semibold text-ink-700">Resume</dt>
          <dd className="mt-0.5">
            <button
              type="button"
              onClick={() => void downloadResume()}
              disabled={downloading}
              className={buttonClass("secondary", "sm")}
            >
              {downloading ? "Opening…" : "Open resume"}
            </button>
          </dd>
        </div>
      </dl>

      <p className="border-l-2 border-slate-300 pl-4 text-sm leading-relaxed text-slate-600">
        Editing or withdrawing an application is not currently supported. To apply for a different
        course, start a new application.
      </p>
    </div>
  );
}
