"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, ApiError } from "@/lib/api";
import type { Application } from "@/lib/app-types";
import { APPLICATION_STATUS_META } from "@/lib/mentor";
import { formatDate } from "@/lib/format";
import { notifyError } from "@/lib/notify";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/Button";

export default function ApplicationDetailView({ id }: { id: string }) {
  const [application, setApplication] = useState<Application | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

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
    setDownloading(true);
    try {
      const { url } = await apiGet<{ url: string }>(`/applications/${id}/resume`);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
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

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
        <Link href="/dashboard/mentor" className="hover:text-ink-700">
          Mentor
        </Link>
        <span aria-hidden> / </span>
        <span className="text-ink-700">Application</span>
      </nav>

      <header>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">{application.course.title}</h1>
        <p className="mt-1 text-sm text-slate-500">Mentor application</p>
      </header>

      <section className="rounded-[20px] border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Status</p>
        <p className={`mt-1 font-display text-lg font-bold ${meta.tone}`}>{meta.label}</p>
        <p className="mt-2 text-sm text-slate-600">{meta.next}</p>
      </section>

      {application.status === "INTERVIEW_SCHEDULED" && (application.interviewAt || application.interviewUrl) && (
        <section className="rounded-[20px] border border-indigo-200 bg-indigo-50 p-5 text-sm">
          <h2 className="font-display font-bold text-indigo-900">Interview details</h2>
          {application.interviewAt && (
            <p className="mt-2 text-indigo-800">Scheduled for {formatDate(application.interviewAt)}</p>
          )}
          {application.interviewUrl && (
            <a
              href={application.interviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block font-semibold text-indigo-700 underline"
            >
              Join interview link
            </a>
          )}
        </section>
      )}

      <dl className="flex flex-col gap-4 rounded-[20px] border border-slate-200 bg-white p-5 text-sm">
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

      <p className="text-sm text-slate-500">
        Editing or withdrawing an application is not currently supported. To apply for a different
        course, start a new application.
      </p>
    </div>
  );
}
