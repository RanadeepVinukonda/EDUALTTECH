"use client";

import { useState } from "react";
import { apiPost, apiPatch, apiDelete } from "@/lib/api";
import type { Roadmap, LessonRow, TopicRow, ChapterRow } from "@/lib/app-types";
import { notifyError, notifySuccess } from "@/lib/notify";
import Button, { buttonClass } from "@/components/ui/Button";
import Input from "@/components/ui/Input";

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

function validate(d: Draft): string | null {
  if (d.title.trim().length < 2) return "Title needs at least 2 characters.";
  if (d.type === "VIDEO" && !isValidUrl(d.contentUrl.trim())) return "Video lessons require a valid URL.";
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
}: {
  initial: Draft;
  submitLabel: string;
  onSubmit: (d: Draft) => Promise<void>;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate(draft);
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
        onChange={(e) => setDraft({ ...draft, title: e.target.value })}
        placeholder="Lesson title"
        aria-label="Lesson title"
      />
      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm text-ink-700">
          <span className="mr-2 font-semibold">Type</span>
          <select
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value as LessonType })}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm"
          >
            <option value="READING">Reading</option>
            <option value="VIDEO">Video</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <input
            type="checkbox"
            checked={draft.isPublished}
            onChange={(e) => setDraft({ ...draft, isPublished: e.target.checked })}
          />
          Published
        </label>
      </div>
      {draft.type === "VIDEO" ? (
        <Input
          type="url"
          value={draft.contentUrl}
          onChange={(e) => setDraft({ ...draft, contentUrl: e.target.value })}
          placeholder="https://… (video URL)"
          aria-label="Video URL"
        />
      ) : (
        <textarea
          value={draft.textContent}
          onChange={(e) => setDraft({ ...draft, textContent: e.target.value })}
          rows={4}
          placeholder="Lesson text"
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

  async function createLesson(d: Draft) {
    try {
      await apiPost(`/topics/${topic.id}/lessons`, payload(d));
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
      await apiPatch(`/lessons/${id}`, payload(d));
      notifySuccess("Lesson saved.");
      setEditingId(null);
      onChanged();
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "Could not save the lesson.");
      throw e;
    }
  }

  async function removeLesson(l: LessonRow) {
    if (!confirm(`Delete lesson "${l.title}"? This cannot be undone.`)) return;
    setBusyId(l.id);
    try {
      await apiDelete(`/lessons/${l.id}`);
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
      await apiPost(`/topics/${topic.id}/lessons/reorder`, { orderedIds: ids });
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
                onSubmit={(d) => saveLesson(l.id, d)}
                onCancel={() => setEditingId(null)}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink-900">
                    {i + 1}. {l.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {l.type === "VIDEO" ? "Video" : "Reading"} ·{" "}
                    {l.isPublished ? <span className="text-emerald-700">Published</span> : <span className="text-amber-700">Draft</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1">
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
                  <button
                    type="button"
                    className={buttonClass("ghost", "sm")}
                    onClick={() => void removeLesson(l)}
                    disabled={busyId === l.id}
                  >
                    Delete
                  </button>
                </div>
              </div>
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
