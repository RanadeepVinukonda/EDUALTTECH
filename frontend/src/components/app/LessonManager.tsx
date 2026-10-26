"use client";

import { useState } from "react";
import { apiPost, apiPatch, apiDelete } from "@/lib/api";
import { uploadPrivateFile } from "@/lib/upload";
import { describeError } from "@/lib/errors";
import type { Roadmap, LessonRow, TopicRow, ChapterRow } from "@/lib/app-types";
import { notifyError, notifySuccess } from "@/lib/notify";
import Button, { buttonClass } from "@/components/ui/Button";
import { DeleteButton } from "@/components/ui/IconActionButton";
import Input from "@/components/ui/Input";
import Checkbox from "@/components/ui/Checkbox";
import Dropzone from "@/components/ui/Dropzone";
import Title from "@mui/icons-material/Title";
import LinkIcon from "@mui/icons-material/Link";
import Category from "@mui/icons-material/Category";
import Lock from "@mui/icons-material/Lock";
import LockOpen from "@mui/icons-material/LockOpen";
import Movie from "@mui/icons-material/Movie";
import Select from "@/components/ui/Select";

type LessonType = "VIDEO" | "READING";

interface Draft {
  title: string;
  type: LessonType;
  contentUrl: string;
  textContent: string;
  isPublished: boolean;
}

const EMPTY: Draft = { title: "", type: "READING", contentUrl: "", textContent: "", isPublished: false };

function isValidUrl(v: string): boolean {
  try {
    new URL(v);
    return true;
  } catch {
    return false;
  }
}

function draftFrom(l: LessonRow): Draft {
  return {
    title: l.title,
    type: l.type,
    contentUrl: l.contentUrl ?? "",
    textContent: l.textContent ?? "",
    isPublished: l.isPublished,
  };
}

function validate(d: Draft, hasVideo: boolean): string | null {
  if (d.title.trim().length < 2) return "Title needs at least 2 characters.";
  if (d.type === "VIDEO" && !hasVideo && !isValidUrl(d.contentUrl.trim()))
    return "Video lessons require an uploaded video file or a valid URL.";
  return null;
}

function payload(d: Draft) {
  return {
    title: d.title.trim(),
    type: d.type,
    contentUrl: d.type === "VIDEO" ? d.contentUrl.trim() : null,
    textContent: d.type === "READING" ? d.textContent : null,
    isPublished: d.isPublished,
  };
}

function LessonForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  hasVideo = false,
}: {
  initial: Draft;
  submitLabel: string;
  onSubmit: (d: Draft) => Promise<void>;
  onCancel: () => void;
  hasVideo?: boolean;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate(draft, hasVideo);
    setErr(v);
    if (v || busy) return;
    setBusy(true);
    try {
      await onSubmit(draft);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <Input
        value={draft.title}
        icon={<Title fontSize="small" />}
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        placeholder="e.g. Intro to closures…"
        aria-label="Lesson title"
      />
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <span className="font-semibold">Type</span>
          <Select
            value={draft.type}
            icon={<Category fontSize="small" />}
            onChange={(e) => setDraft({ ...draft, type: e.target.value as LessonType })}
            aria-label="Lesson type"
            className="w-40 py-2"
          >
            <option value="READING">Reading</option>
            <option value="VIDEO">Video</option>
          </Select>
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <Checkbox checked={draft.isPublished} onChange={(v) => setDraft({ ...draft, isPublished: v })} />
          Unlock for learners
        </label>
      </div>
      {draft.type === "VIDEO" ? (
        <div className="flex flex-col gap-1.5">
          <Input
            type="url"
            value={draft.contentUrl}
            icon={<LinkIcon fontSize="small" />}
            onChange={(e) => setDraft({ ...draft, contentUrl: e.target.value })}
            placeholder="https://… (video URL)"
            aria-label="Video URL"
          />
          <p className="text-xs text-slate-500">
            {hasVideo ? "A video file is uploaded. You can also paste a URL." : "Or upload an .mp4 / .webm file from the lesson row."}
          </p>
        </div>
      ) : (
        <textarea
          value={draft.textContent}
          onChange={(e) => setDraft({ ...draft, textContent: e.target.value })}
          rows={4}
          placeholder="Lesson text content…"
          aria-label="Lesson text"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
        />
      )}
      {err && <p className="text-sm text-danger">{err}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={busy}>
          {submitLabel}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function TopicBlock({ topic, onChanged }: { topic: TopicRow; onChanged: () => void }) {
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [videoFor, setVideoFor] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);

  async function createLesson(d: Draft) {
    try {
      await apiPost(`/courses/topics/${topic.id}/lessons`, payload(d));
      notifySuccess("Lesson created.");
      setAdding(false);
      onChanged();
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "Could not create the lesson.");
      throw e;
    }
  }

  async function saveLesson(id: string, d: Draft) {
    try {
      await apiPatch(`/courses/lessons/${id}`, payload(d));
      notifySuccess("Lesson saved.");
      setEditingId(null);
      onChanged();
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "Could not save the lesson.");
      throw e;
    }
  }

  async function toggleUnlock(l: LessonRow) {
    setBusyId(l.id);
    try {
      await apiPatch(`/courses/lessons/${l.id}`, { isPublished: !l.isPublished });
      notifySuccess(l.isPublished ? "Lesson locked." : "Lesson unlocked — learners notified.");
      onChanged();
    } catch (e) {
      notifyError(describeError(e, "Could not update the lesson."));
    } finally {
      setBusyId(null);
    }
  }

  async function uploadVideo(l: LessonRow) {
    if (!videoFile) return;
    setBusyId(l.id);
    try {
      await uploadPrivateFile(`/courses/lessons/${l.id}/video/sign`, `/courses/lessons/${l.id}/video`, videoFile);
      notifySuccess("Video uploaded.");
      setVideoFor(null);
      setVideoFile(null);
      onChanged();
    } catch (e) {
      notifyError(describeError(e, "Could not upload the video."));
    } finally {
      setBusyId(null);
    }
  }

  async function removeLesson(l: LessonRow) {
    if (!confirm(`Delete lesson "${l.title}"? This cannot be undone.`)) return;
    setBusyId(l.id);
    try {
      await apiDelete(`/courses/lessons/${l.id}`);
      notifySuccess("Lesson deleted.");
      onChanged();
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "Could not delete the lesson.");
    } finally {
      setBusyId(null);
    }
  }

  async function move(index: number, dir: -1 | 1) {
    const ids = topic.lessons.map((l) => l.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    setBusyId(topic.lessons[index].id);
    try {
      await apiPost(`/courses/topics/${topic.id}/lessons/reorder`, { orderedIds: ids });
      onChanged();
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "Could not reorder lessons.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="font-semibold text-ink-900">{topic.title}</h4>
        <button type="button" className={buttonClass("ghost", "sm")} onClick={() => setAdding((v) => !v)}>
          {adding ? "Cancel" : "Add lesson"}
        </button>
      </div>

      {adding && (
        <div className="mt-3">
          <LessonForm initial={EMPTY} submitLabel="Create lesson" onSubmit={createLesson} onCancel={() => setAdding(false)} />
        </div>
      )}

      <ul className="mt-3 flex flex-col divide-y divide-slate-100">
        {topic.lessons.length === 0 && <li className="py-2 text-sm text-slate-400">No lessons in this topic yet.</li>}
        {topic.lessons.map((l, i) => (
          <li key={l.id} className="py-3">
            {editingId === l.id ? (
              <LessonForm
                initial={draftFrom(l)}
                submitLabel="Save"
                hasVideo={l.hasVideo}
                onSubmit={(d) => saveLesson(l.id, d)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink-900">
                      {i + 1}. {l.title}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span>{l.type === "VIDEO" ? "Video" : "Reading"}</span>
                      <span aria-hidden className="text-slate-300">·</span>
                      {l.isPublished ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <LockOpen fontSize="inherit" aria-hidden /> Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                          <Lock fontSize="inherit" aria-hidden /> Locked
                        </span>
                      )}
                      {l.type === "VIDEO" && l.hasVideo && (
                        <span className="inline-flex items-center gap-1 font-medium text-slate-500">
                          <Movie fontSize="inherit" aria-hidden /> Video uploaded
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    {l.type === "VIDEO" && (
                      <button
                        type="button"
                        className={buttonClass("ghost", "sm")}
                        onClick={() => {
                          setVideoFor(videoFor === l.id ? null : l.id);
                          setVideoFile(null);
                        }}
                        disabled={busyId === l.id}
                      >
                        {l.hasVideo ? "Replace video" : "Upload video"}
                      </button>
                    )}
                    <button
                      type="button"
                      className={buttonClass(l.isPublished ? "ghost" : "primary", "sm")}
                      onClick={() => void toggleUnlock(l)}
                      disabled={busyId === l.id || (!l.isPublished && !(l.hasVideo || l.contentUrl || (l.textContent ?? "").trim()))}
                      title={
                        !l.isPublished && !(l.hasVideo || l.contentUrl || (l.textContent ?? "").trim())
                          ? "Add a video, link, or content before unlocking"
                          : undefined
                      }
                    >
                      {l.isPublished ? "Lock" : "Complete & unlock"}
                    </button>
                    <button
                      type="button"
                      className={buttonClass("ghost", "sm")}
                      onClick={() => void move(i, -1)}
                      disabled={i === 0 || busyId === l.id}
                      aria-label="Move lesson up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={buttonClass("ghost", "sm")}
                      onClick={() => void move(i, 1)}
                      disabled={i === topic.lessons.length - 1 || busyId === l.id}
                      aria-label="Move lesson down"
                    >
                      ↓
                    </button>
                    <button type="button" className={buttonClass("ghost", "sm")} onClick={() => setEditingId(l.id)}>
                      Edit
                    </button>
                    <DeleteButton
                      onClick={() => void removeLesson(l)}
                      disabled={busyId === l.id}
                    />
                  </div>
                </div>
                {videoFor === l.id && (
                  <div className="mt-3 flex flex-col gap-2">
                    <Dropzone
                      accept=".mp4,.webm,video/mp4,video/webm"
                      hint="MP4 or WebM · uploads directly to storage"
                      file={videoFile}
                      onFile={setVideoFile}
                      ariaLabel={`Upload video for ${l.title}`}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" loading={busyId === l.id} disabled={!videoFile || busyId === l.id} onClick={() => void uploadVideo(l)}>
                        Upload
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setVideoFor(null);
                          setVideoFile(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LessonManager({
  roadmap,
  isOwner,
  onChanged,
}: {
  roadmap: Roadmap;
  isOwner: boolean;
  onChanged: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      {!isOwner && (
        <p role="note" className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          You can add, edit, publish, reorder, and delete lessons in existing topics. Creating new
          chapters or topics is restricted to the course owner and admins.
        </p>
      )}

      {roadmap.chapters.length === 0 && (
        <p className="text-sm text-slate-500">This course has no chapters yet.</p>
      )}

      {roadmap.chapters.map((chapter: ChapterRow) => (
        <section key={chapter.id} aria-labelledby={`ch-${chapter.id}`}>
          <h3 id={`ch-${chapter.id}`} className="font-display text-lg font-bold text-ink-900">
            {chapter.title}
          </h3>
          <div className="mt-3 flex flex-col gap-4">
            {chapter.topics.length === 0 && (
              <p className="text-sm text-slate-400">No topics in this chapter yet.</p>
            )}
            {chapter.topics.map((topic) => (
              <TopicBlock key={topic.id} topic={topic} onChanged={onChanged} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
