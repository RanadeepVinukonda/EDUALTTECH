"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import type { MeetingRow, Roadmap } from "@/lib/app-types";
import { formatDate, formatCountdown } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/notify";
import { cn } from "@/lib/cn";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Button, { buttonClass } from "@/components/ui/Button";

type Scope = "upcoming" | "past" | "all";

function isValidUrl(v: string): boolean {
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

export default function MeetingManager({ courseId, readOnly = false }: { courseId: string; readOnly?: boolean }) {
  const [scope, setScope] = useState<Scope>("upcoming");
  const [meetings, setMeetings] = useState<MeetingRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [topics, setTopics] = useState<{ id: string; title: string; chapterId: string; chapterTitle: string }[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMin, setDurationMin] = useState(60);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [topicId, setTopicId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { meetings } = await apiGet<{ meetings: MeetingRow[] }>(`/courses/${courseId}/meetings`, { scope });
      setMeetings(meetings);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load meetings.");
    }
  }, [courseId, scope]);

  useEffect(() => {
    void load();
  }, [load]);

  // Live countdown so both learner and mentor see the session approaching.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Staff can attach a session to a roadmap topic; learners never create.
  useEffect(() => {
    if (readOnly) return;
    let alive = true;
    apiGet<Roadmap>(`/courses/${courseId}/roadmap`)
      .then((rm) => {
        if (!alive) return;
        setTopics(
          rm.chapters.flatMap((ch) =>
            ch.topics.map((t) => ({ id: t.id, title: t.title, chapterId: ch.id, chapterTitle: ch.title })),
          ),
        );
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [courseId, readOnly]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (title.trim().length < 2) return setFormError("Title needs at least 2 characters.");
    if (!scheduledAt) return setFormError("Choose a date and time.");
    if (!isValidUrl(meetingUrl.trim())) return setFormError("Provide a valid meeting URL.");
    if (durationMin < 15 || durationMin > 480) return setFormError("Duration must be between 15 and 480 minutes.");
    setFormError(null);
    setBusy(true);
    try {
      const topic = topics.find((t) => t.id === topicId);
      await apiPost(`/courses/${courseId}/meetings`, {
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMin,
        meetingUrl: meetingUrl.trim(),
        chapterId: topic?.chapterId ?? null,
        topicId: topic?.id ?? null,
      });
      notifySuccess("Meeting scheduled.");
      setTitle("");
      setDescription("");
      setScheduledAt("");
      setDurationMin(60);
      setMeetingUrl("");
      setTopicId("");
      setScope("upcoming");
      await load();
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "Could not schedule the meeting.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(m: MeetingRow) {
    if (!confirm(`Cancel meeting "${m.title}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/meetings/${m.id}`);
      notifySuccess("Meeting cancelled.");
      await load();
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "Could not cancel the meeting.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {!readOnly && (
        <section aria-labelledby="new-meeting-h" className="rounded-[20px] border border-slate-200 bg-white p-5">
        <h3 id="new-meeting-h" className="font-display text-lg font-bold text-ink-900">
          Schedule a meeting
        </h3>
        <form onSubmit={create} className="mt-4 flex flex-col gap-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Meeting title"
            aria-label="Meeting title"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-ink-700">Date &amp; time</span>
              <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-ink-700">Duration (minutes)</span>
              <Input
                type="number"
                min={15}
                max={480}
                value={durationMin}
                onChange={(e) => setDurationMin(Number(e.target.value))}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-ink-700">Attach to topic (optional)</span>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            >
              <option value="">Course-wide</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.chapterTitle} · {t.title}
                </option>
              ))}
            </select>
          </label>
          <Input
            type="url"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="https://… (meeting link)"
            aria-label="Meeting link"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Description (optional)"
            aria-label="Meeting description"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
          {formError && <p className="text-sm text-danger">{formError}</p>}
          <div>
            <Button type="submit" size="sm" loading={busy}>
              Schedule
            </Button>
          </div>
        </form>
        </section>
      )}

      <section aria-labelledby="meetings-h">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 id="meetings-h" className="font-display text-lg font-bold text-ink-900">
            Meetings
          </h3>
          <div role="tablist" aria-label="Meeting scope" className="flex gap-1">
            {(["upcoming", "past", "all"] as Scope[]).map((s) => (
              <button
                key={s}
                type="button"
                role="tab"
                aria-selected={scope === s}
                onClick={() => setScope(s)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-semibold capitalize",
                  scope === s ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mt-3">
            <ErrorState message={error} onRetry={() => void load()} />
          </div>
        ) : !meetings ? (
          <Spinner label="Loading meetings…" />
        ) : meetings.length === 0 ? (
          <div className="mt-3">
            <EmptyState title={`No ${scope} meetings`} description="Scheduled sessions will appear here." />
          </div>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-slate-200 rounded-[20px] border border-slate-200 bg-white">
            {meetings.map((m) => {
              const start = new Date(m.scheduledAt).getTime();
              const end = start + m.durationMin * 60_000;
              return (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900">{m.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {formatDate(m.scheduledAt)} · {m.durationMin} min
                      {m.topic?.title ? ` · ${m.topic.title}` : ""}
                    </p>
                    {start > now ? (
                      <p className="mt-0.5 text-sm font-semibold text-brand-600">
                        Starts in {formatCountdown(start - now)}
                      </p>
                    ) : end >= now ? (
                      <p className="mt-0.5 text-sm font-semibold text-green-700">Live now</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={m.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonClass("secondary", "sm")}
                    >
                      Join link
                    </a>
                    {!readOnly && (
                      <button type="button" className={buttonClass("ghost", "sm")} onClick={() => void remove(m)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
