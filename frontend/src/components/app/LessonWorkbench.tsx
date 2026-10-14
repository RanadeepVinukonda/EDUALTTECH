"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { uploadPrivateFile } from "@/lib/upload";
import { describeError } from "@/lib/errors";
import type { Roadmap, LessonRow, TopicRow, ChapterRow, MeetingRow, ResourceRow } from "@/lib/app-types";
import { notifyError, notifySuccess } from "@/lib/notify";
import Button, { buttonClass } from "@/components/ui/Button";
import { DeleteButton } from "@/components/ui/IconActionButton";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import Dropzone from "@/components/ui/Dropzone";
import Select from "@/components/ui/Select";
import Add from "@mui/icons-material/Add";
import Title from "@mui/icons-material/Title";
import LinkIcon from "@mui/icons-material/Link";
import Category from "@mui/icons-material/Category";
import Videocam from "@mui/icons-material/Videocam";
import MenuBook from "@mui/icons-material/MenuBook";
import Event from "@mui/icons-material/Event";
import Movie from "@mui/icons-material/Movie";
import Article from "@mui/icons-material/Article";

const RES_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,.png,.jpg,.jpeg,.webp,.gif,.svg,.mp4,.webm";
const MAX_BYTES = 5 * 1024 * 1024;
type Panel = "meeting" | "recording" | "resource";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

function isValidUrl(v: string): boolean {
  try { new URL(v); return true; } catch { return false; }
}

function Countdown({ to }: { to: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const ms = new Date(to).getTime() - now;
  if (ms <= 0) return <span className="font-semibold text-emerald-700">Live now</span>;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return <span>{d > 0 ? `${d}d ${h}h` : `${h}h ${m}m ${s}s`}</span>;
}

interface Ctx {
  courseId: string;
  onChanged: () => void;
  reloadMeetings: () => void;
  reloadResources: () => void;
  nextMeeting: Map<string, MeetingRow>;
  resourceCount: Map<string, number>;
}

function MeetingForm({ lesson, ctx, onClose }: { lesson: LessonRow; ctx: Ctx; onClose: () => void }) {
  const [title, setTitle] = useState(lesson.title);
  const [scheduledAt, setScheduledAt] = useState(() =>
    new Date(Date.now() + 3600000 - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
  );
  const [durationMin, setDurationMin] = useState(60);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) return setErr("Title needs at least 2 characters.");
    if (!isValidUrl(meetingUrl.trim())) return setErr("Enter a valid meeting URL.");
    setErr(null);
    setBusy(true);
    try {
      await apiPost(`/courses/${ctx.courseId}/meetings`, {
        title: title.trim(),
        scheduledAt: new Date(scheduledAt).toISOString(),
        durationMin,
        meetingUrl: meetingUrl.trim(),
        lessonId: lesson.id,
        topicId: lesson.topicId,
      });
      notifySuccess("Meeting scheduled — learners notified.");
      ctx.reloadMeetings();
      onClose();
    } catch (e) {
      notifyError(describeError(e, "Could not schedule the meeting."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <Input value={title} icon={<Event fontSize="small" />} onChange={(e) => setTitle(e.target.value)} placeholder="Session title" aria-label="Meeting title" />
      <div className="flex flex-wrap gap-2">
        <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} aria-label="Meeting time" className="w-56" />
        <Input type="number" min={15} max={480} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value) || 60)} aria-label="Duration (minutes)" className="w-28" />
      </div>
      <Input type="url" value={meetingUrl} icon={<LinkIcon fontSize="small" />} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://meet… (join link)" aria-label="Meeting URL" />
      {err && <p className="text-sm text-danger">{err}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={busy}>Schedule meeting</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}

function RecordingForm({ lesson, ctx, onClose }: { lesson: LessonRow; ctx: Ctx; onClose: () => void }) {
  const [mode, setMode] = useState<"link" | "upload">("link");
  const [url, setUrl] = useState(lesson.contentUrl ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (mode === "link" && !isValidUrl(url.trim())) return setErr("Enter a valid video URL.");
    if (mode === "upload" && !file) return setErr("Choose an .mp4 or .webm file.");
    setBusy(true);
    try {
      if (mode === "link") {
        await apiPatch(`/courses/lessons/${lesson.id}`, { type: "VIDEO", contentUrl: url.trim() });
      } else {
        await uploadPrivateFile(`/courses/lessons/${lesson.id}/video/sign`, `/courses/lessons/${lesson.id}/video`, file!);
      }
      notifySuccess("Recording saved.");
      ctx.onChanged();
      onClose();
    } catch (e) {
      notifyError(describeError(e, "Could not save the recording."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex gap-2 text-sm">
        <button type="button" className={buttonClass(mode === "link" ? "primary" : "ghost", "sm")} onClick={() => setMode("link")}>Paste link</button>
        <button type="button" className={buttonClass(mode === "upload" ? "primary" : "ghost", "sm")} onClick={() => setMode("upload")}>Upload file</button>
      </div>
      {mode === "link" ? (
        <Input type="url" value={url} icon={<Movie fontSize="small" />} onChange={(e) => setUrl(e.target.value)} placeholder="https://… (recording URL)" aria-label="Recording URL" />
      ) : (
        <Dropzone accept=".mp4,.webm,video/mp4,video/webm" hint="MP4 or WebM · uploads directly to storage" file={file} onFile={setFile} ariaLabel={`Upload recording for ${lesson.title}`} />
      )}
      {err && <p className="text-sm text-danger">{err}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={busy}>Save recording</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}

function ResourceForm({ lesson, ctx, onClose }: { lesson: LessonRow; ctx: Ctx; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("pdf");
  const [mode, setMode] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 2) return setErr("Title needs at least 2 characters.");
    if (mode === "file" && !file) return setErr("Choose a file to upload.");
    if (mode === "file" && file && file.size > MAX_BYTES) return setErr("File must be 5 MB or smaller.");
    if (mode === "link" && !isValidUrl(linkUrl.trim())) return setErr("Enter a valid URL.");
    setErr(null);
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        kind: kind.trim() || "pdf",
        courseId: ctx.courseId,
        lessonId: lesson.id,
        topicId: lesson.topicId,
        linkUrl: mode === "link" ? linkUrl.trim() : null,
        file: null,
      };
      if (mode === "file" && file) {
        payload.file = { name: file.name, type: file.type, data: await fileToBase64(file) };
      }
      await apiPost("/resources", payload);
      notifySuccess("Resource posted.");
      ctx.reloadResources();
      onClose();
    } catch (e) {
      notifyError(describeError(e, "Could not post the resource."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap gap-2">
        <Input value={title} icon={<MenuBook fontSize="small" />} onChange={(e) => setTitle(e.target.value)} placeholder="Resource title" aria-label="Resource title" className="min-w-[12rem] flex-1" />
        <Select value={kind} icon={<Category fontSize="small" />} onChange={(e) => setKind(e.target.value)} aria-label="Resource kind" className="w-36">
          <option value="pdf">PDF</option>
          <option value="doc">Doc</option>
          <option value="slides">Slides</option>
          <option value="video">Video</option>
          <option value="link">Link</option>
          <option value="image">Image</option>
        </Select>
      </div>
      <div className="flex gap-2 text-sm">
        <button type="button" className={buttonClass(mode === "file" ? "primary" : "ghost", "sm")} onClick={() => setMode("file")}>Upload file</button>
        <button type="button" className={buttonClass(mode === "link" ? "primary" : "ghost", "sm")} onClick={() => setMode("link")}>Paste link</button>
      </div>
      {mode === "file" ? (
        <Dropzone accept={RES_ACCEPT} hint="Up to 5 MB · uploads to storage" file={file} onFile={setFile} ariaLabel={`Upload resource for ${lesson.title}`} />
      ) : (
        <Input type="url" value={linkUrl} icon={<LinkIcon fontSize="small" />} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://… (resource link)" aria-label="Resource URL" />
      )}
      {err && <p className="text-sm text-danger">{err}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={busy}>Post resource</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}

function LessonRow({ lesson, index, siblings, ctx }: { lesson: LessonRow; index: number; siblings: LessonRow[]; ctx: Ctx }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);

  const meeting = ctx.nextMeeting.get(lesson.id);
  const resCount = ctx.resourceCount.get(lesson.id) ?? 0;
  const hasContent = lesson.hasVideo || Boolean(lesson.contentUrl) || Boolean((lesson.textContent ?? "").trim());

  async function toggleComplete(next: boolean) {
    setBusy(true);
    try {
      await apiPatch(`/courses/lessons/${lesson.id}`, { isPublished: next });
      notifySuccess(next ? "Lesson unlocked — learners notified." : "Lesson locked.");
      ctx.onChanged();
    } catch (e) {
      notifyError(describeError(e, "Could not update the lesson."));
    } finally {
      setBusy(false);
    }
  }

  async function saveTitle() {
    if (title.trim().length < 2) return;
    setBusy(true);
    try {
      await apiPatch(`/courses/lessons/${lesson.id}`, { title: title.trim() });
      notifySuccess("Lesson saved.");
      setEditing(false);
      ctx.onChanged();
    } catch (e) {
      notifyError(describeError(e, "Could not save the lesson."));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete lesson "${lesson.title}"? This cannot be undone.`)) return;
    setBusy(true);
    try {
      await apiDelete(`/courses/lessons/${lesson.id}`);
      notifySuccess("Lesson deleted.");
      ctx.onChanged();
    } catch (e) {
      notifyError(describeError(e, "Could not delete the lesson."));
    } finally {
      setBusy(false);
    }
  }

  async function move(dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= siblings.length) return;
    const ids = siblings.map((l) => l.id);
    [ids[index], ids[j]] = [ids[j], ids[index]];
    setBusy(true);
    try {
      await apiPost(`/courses/topics/${lesson.topicId}/lessons/reorder`, { orderedIds: ids });
      ctx.onChanged();
    } catch (e) {
      notifyError(describeError(e, "Could not reorder lessons."));
    } finally {
      setBusy(false);
    }
  }

  function open(kind: Panel) {
    setPanel((p) => (p === kind ? null : kind));
    setMenuOpen(false);
  }

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Checkbox
          checked={lesson.isPublished}
          disabled={busy || (!lesson.isPublished && !hasContent)}
          onChange={(v) => void toggleComplete(v)}
          aria-label={`Mark ${lesson.title} ${lesson.isPublished ? "not completed" : "completed"}`}
        />
        <div className="min-w-0 flex-1">
          {editing ? (
            <div className="flex items-center gap-2">
              <Input value={title} icon={<Title fontSize="small" />} onChange={(e) => setTitle(e.target.value)} aria-label="Lesson title" className="py-1.5" />
              <Button size="sm" loading={busy} onClick={() => void saveTitle()}>Save</Button>
              <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setTitle(lesson.title); }}>Cancel</Button>
            </div>
          ) : (
            <>
              <button type="button" className="text-left text-sm font-medium text-ink-900 hover:text-brand-700" onClick={() => setEditing(true)} title="Rename lesson">
                {index + 1}. {lesson.title}
              </button>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1">
                  {lesson.type === "VIDEO" ? <Videocam fontSize="inherit" aria-hidden /> : <Article fontSize="inherit" aria-hidden />}
                  {lesson.type === "VIDEO" ? "Video" : "Reading"}
                </span>
                {lesson.hasVideo && <span className="inline-flex items-center gap-1 text-slate-500"><Movie fontSize="inherit" aria-hidden /> uploaded</span>}
                {resCount > 0 && <span aria-hidden>·</span>}
                {resCount > 0 && <span className="inline-flex items-center gap-1"><MenuBook fontSize="inherit" aria-hidden /> {resCount} {resCount === 1 ? "resource" : "resources"}</span>}
                {lesson.isPublished
                  ? <><span aria-hidden>·</span><span className="font-semibold text-emerald-700">Completed</span></>
                  : <><span aria-hidden>·</span><span className="font-semibold text-amber-700">Not completed</span></>}
              </p>
            </>
          )}
        </div>

        {meeting && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
            <Event fontSize="inherit" aria-hidden />
            <span className="text-slate-500">in</span>
            <Countdown to={meeting.scheduledAt} />
          </span>
        )}

        <div className="relative flex items-center gap-1">
          <button
            type="button"
            className={buttonClass("ghost", "sm")}
            aria-label="Add to lesson"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Add fontSize="small" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              {([
                { kind: "meeting" as Panel, label: "Schedule meeting", icon: <Event fontSize="small" /> },
                { kind: "recording" as Panel, label: "Recording (link/file)", icon: <Movie fontSize="small" /> },
                { kind: "resource" as Panel, label: "Add resource", icon: <MenuBook fontSize="small" /> },
              ]).map((opt) => (
                <button
                  key={opt.kind}
                  type="button"
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink-700 hover:bg-slate-50"
                  onClick={() => open(opt.kind)}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          )}
          <button type="button" className={buttonClass("ghost", "sm")} onClick={() => void move(-1)} disabled={index === 0 || busy} aria-label="Move lesson up">↑</button>
          <button type="button" className={buttonClass("ghost", "sm")} onClick={() => void move(1)} disabled={index === siblings.length - 1 || busy} aria-label="Move lesson down">↓</button>
          <DeleteButton onClick={() => void remove()} disabled={busy} />
        </div>
      </div>
      {panel === "meeting" && <MeetingForm lesson={lesson} ctx={ctx} onClose={() => setPanel(null)} />}
      {panel === "recording" && <RecordingForm lesson={lesson} ctx={ctx} onClose={() => setPanel(null)} />}
      {panel === "resource" && <ResourceForm lesson={lesson} ctx={ctx} onClose={() => setPanel(null)} />}
    </li>
  );
}

export default function LessonWorkbench({
  courseId,
  roadmap,
  onChanged,
  isOwner,
}: {
  courseId: string;
  roadmap: Roadmap;
  onChanged: () => void;
  isOwner: boolean;
}) {
  const [meetings, setMeetings] = useState<MeetingRow[]>([]);
  const [resources, setResources] = useState<ResourceRow[]>([]);

  const reloadMeetings = useCallback(async () => {
    try {
      const { meetings: list } = await apiGet<{ meetings: MeetingRow[] }>(`/courses/${courseId}/meetings`, { scope: "all" });
      setMeetings(list);
    } catch { /* non-fatal: timer chips just won't render */ }
  }, [courseId]);

  const reloadResources = useCallback(async () => {
    try {
      const { resources: list } = await apiGet<{ resources: ResourceRow[] }>("/resources");
      setResources(list);
    } catch { /* non-fatal */ }
  }, []);

  useEffect(() => { void reloadMeetings(); void reloadResources(); }, [reloadMeetings, reloadResources]);

  const nextMeeting = useMemo(() => {
    const now = Date.now();
    const m = new Map<string, MeetingRow>();
    for (const row of meetings) {
      if (!row.lessonId || new Date(row.scheduledAt).getTime() < now) continue;
      const cur = m.get(row.lessonId);
      if (!cur || new Date(row.scheduledAt) < new Date(cur.scheduledAt)) m.set(row.lessonId, row);
    }
    return m;
  }, [meetings]);

  const resourceCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of resources) if (r.lessonId) m.set(r.lessonId, (m.get(r.lessonId) ?? 0) + 1);
    return m;
  }, [resources]);

  const ctx: Ctx = { courseId, onChanged, reloadMeetings: () => void reloadMeetings(), reloadResources: () => void reloadResources(), nextMeeting, resourceCount };

  return (
    <div className="flex flex-col gap-6">
      {!isOwner && (
        <p role="note" className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Use the <strong>+</strong> on any lesson to attach a meeting, a session recording (link or upload),
          or resources. Tick the checkbox to mark a lesson complete and unlock it for learners.
        </p>
      )}

      {roadmap.chapters.length === 0 && <p className="text-sm text-slate-500">This course has no chapters yet.</p>}

      {roadmap.chapters.map((chapter: ChapterRow) => (
        <section key={chapter.id} aria-labelledby={`wb-ch-${chapter.id}`}>
          <h3 id={`wb-ch-${chapter.id}`} className="font-display text-lg font-bold text-ink-900">{chapter.title}</h3>
          <div className="mt-3 flex flex-col gap-4">
            {chapter.topics.map((topic: TopicRow) => (
              <div key={topic.id} className="rounded-xl border border-slate-200 p-4">
                <h4 className="font-semibold text-ink-900">{topic.title}</h4>
                {topic.lessons.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">No lessons in this topic yet.</p>
                ) : (
                  <ul className="mt-2 flex flex-col divide-y divide-slate-100">
                    {topic.lessons.map((lesson, i) => (
                      <LessonRow key={lesson.id} lesson={lesson} index={i} siblings={topic.lessons} ctx={ctx} />
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
