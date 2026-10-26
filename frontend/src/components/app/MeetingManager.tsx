"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiGet, apiPost, apiDelete } from "@/lib/api";
import { uploadPrivateFile, fetchPrivateUrl } from "@/lib/upload";
import type { MeetingRow, Roadmap } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import { describeError } from "@/lib/errors";
import { notifyError, notifySuccess } from "@/lib/notify";
import { cn } from "@/lib/cn";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Button, { buttonClass } from "@/components/ui/Button";
import Dropzone from "@/components/ui/Dropzone";
import FlipClock from "@/components/ui/FlipClock";
import Title from "@mui/icons-material/Title";
import Event from "@mui/icons-material/Event";
import AccessTime from "@mui/icons-material/AccessTime";
import MenuBook from "@mui/icons-material/MenuBook";
import LinkIcon from "@mui/icons-material/Link";
import NotificationsActive from "@mui/icons-material/NotificationsActive";
import Movie from "@mui/icons-material/Movie";

type Scope = "upcoming" | "past" | "all";

function isValidUrl(v: string): boolean {
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

function RecordingPlayer({ meetingId }: { meetingId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function open() {
    setBusy(true);
    setErr(null);
    try {
      setUrl(await fetchPrivateUrl(`/meetings/${meetingId}/recording`));
    } catch (e) {
      setErr(describeError(e, "Could not load the recording."));
    } finally {
      setBusy(false);
    }
  }

  if (url) return <video controls className="w-full max-w-xl rounded-xl bg-black" src={url} />;
  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="secondary" loading={busy} onClick={() => void open()}>
        <Movie fontSize="small" aria-hidden /> Watch recording
      </Button>
      {err && <span className="text-xs text-danger">{err}</span>}
    </div>
  );
}

function RecordingUploader({ meetingId, hasRecording, onDone }: { meetingId: string; hasRecording: boolean; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function upload() {
    if (!file) return;
    setBusy(true);
    try {
      await uploadPrivateFile(`/meetings/${meetingId}/recording/sign`, `/meetings/${meetingId}/recording`, file);
      notifySuccess("Recording uploaded.");
      setOpen(false);
      setFile(null);
      onDone();
    } catch (e) {
      notifyError(describeError(e, "Could not upload the recording."));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" className={buttonClass("ghost", "sm")} onClick={() => setOpen(true)}>
        {hasRecording ? "Replace recording" : "Add recording"}
      </button>
    );
  }
  return (
    <div className="flex w-full flex-col gap-2">
      <Dropzone
        accept=".mp4,.webm,video/mp4,video/webm"
        hint="MP4 or WebM · uploads directly to storage"
        file={file}
        onFile={setFile}
        ariaLabel="Upload meeting recording"
      />
      <div className="flex gap-2">
        <Button size="sm" loading={busy} disabled={!file || busy} onClick={() => void upload()}>
          Upload
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setOpen(false);
            setFile(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function MeetingManager({ courseId, readOnly = false }: { courseId: string; readOnly?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const [scope, setScope] = useState<Scope>("upcoming");
  const [ready, setReady] = useState(false);
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

  // Restore the scope filter from the URL.
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("scope");
    if (raw === "past" || raw === "all") setScope(raw);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    void load();
  }, [load, ready]);

  // Keep the scope filter in the URL.
  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    if (scope === "upcoming") params.delete("scope");
    else params.set("scope", scope);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [scope, ready, pathname, router]);

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

  async function remind(m: MeetingRow) {
    try {
      await apiPost(`/meetings/${m.id}/remind`);
      notifySuccess("Reminder emailed to enrolled learners.");
    } catch (e) {
      notifyError(describeError(e, "Could not send the reminder."));
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
            icon={<Title fontSize="small" />}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-ink-700">Date &amp; time</span>
              <Input type="datetime-local" value={scheduledAt} icon={<Event fontSize="small" />} onChange={(e) => setScheduledAt(e.target.value)} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-ink-700">Duration (minutes)</span>
              <Input
                type="number"
                min={15}
                max={480}
                value={durationMin}
                icon={<AccessTime fontSize="small" />}
                onChange={(e) => setDurationMin(Number(e.target.value))}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-semibold text-ink-700">Attach to topic (optional)</span>
            <Select
              value={topicId}
              icon={<MenuBook fontSize="small" />}
              onChange={(e) => setTopicId(e.target.value)}
            >
              <option value="">Course-wide</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.chapterTitle} · {t.title}
                </option>
              ))}
            </Select>
          </label>
          <Input
            type="url"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            placeholder="https://… (meeting link)"
            aria-label="Meeting link"
            icon={<LinkIcon fontSize="small" />}
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
          <div role="group" aria-label="Meeting scope" className="flex gap-1">
            {(["upcoming", "past", "all"] as Scope[]).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={scope === s}
                onClick={() => setScope(s)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-semibold capitalize",
                  scope === s ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700 hover:bg-slate-200",
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
              const upcoming = start > now;
              const live = !upcoming && end >= now;
              return (
                <li key={m.id} className="flex flex-col gap-3 p-4 sm:p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900">{m.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {formatDate(m.scheduledAt)} · {m.durationMin} min
                        {m.topic?.title ? ` · ${m.topic.title}` : ""}
                      </p>
                      {live && <p className="mt-0.5 text-sm font-semibold text-green-700">Live now</p>}
                      {m.hasRecording && !readOnly && (
                        <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                          <Movie fontSize="inherit" aria-hidden /> Recording uploaded
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <a href={m.meetingUrl} target="_blank" rel="noopener noreferrer" className={buttonClass("secondary", "sm")}>
                        Join link
                      </a>
                      {!readOnly && upcoming && (
                        <button type="button" className={buttonClass("ghost", "sm")} onClick={() => void remind(m)}>
                          <NotificationsActive fontSize="small" aria-hidden /> Email reminder
                        </button>
                      )}
                      {!readOnly && <RecordingUploader meetingId={m.id} hasRecording={Boolean(m.hasRecording)} onDone={() => void load()} />}
                      {!readOnly && (
                        <button type="button" className={buttonClass("danger", "sm")} onClick={() => void remove(m)}>
                          Cancel
                        </button>
                      )}
                      {readOnly && m.hasRecording && <RecordingPlayer meetingId={m.id} />}
                    </div>
                  </div>
                  {upcoming && (
                    <div className="rounded-xl bg-ink-900/95 p-3">
                      <FlipClock to={m.scheduledAt} label="Starts in" />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
