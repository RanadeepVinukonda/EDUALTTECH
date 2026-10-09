"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError, apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { ChapterRow, LessonRow, Roadmap, TopicRow } from "@/lib/app-types";
import { notifySuccess } from "@/lib/notify";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { AdminHeader, Panel, Skeleton, StatusPill, useAsync } from "./admin-ui";

function rmError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.code === "FORBIDDEN" || err.status === 403) return "You don’t have permission to edit this roadmap.";
    if (err.code === "UNAUTHORIZED" || err.status === 401) return "Your session expired. Please sign in again.";
    if (err.code === "VALIDATION") return err.message || "Please check the fields and try again.";
    if (err.code === "NOT_FOUND" || err.status === 404) return "This item no longer exists. The roadmap was refreshed.";
    if (err.code === "RATE_LIMITED" || err.status === 429) return "Too many requests. Please wait a moment.";
  }
  return err instanceof Error ? err.message : fallback;
}

function move<T>(list: T[], index: number, dir: -1 | 1): T[] | null {
  const target = index + dir;
  if (target < 0 || target >= list.length) return null;
  const next = [...list];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function isUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function AdminRoadmapBuilder({ courseId, courseTitle }: { courseId: string; courseTitle?: string }) {
  const { data, error, loading, reload } = useAsync(() => apiGet<Roadmap>(`/courses/${courseId}/roadmap`), [courseId]);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Roadmap builder"
        description={courseTitle ? `${courseTitle} · chapters, topics and lessons in order.` : "Structure the course into chapters, topics and lessons."}
        actions={
          <Link href={`/dashboard/admin/courses/${courseId}`} className="text-sm font-semibold text-brand-700 hover:underline">
            ← Course editor
          </Link>
        }
      />

      {error ? (
        <ErrorState message={rmError(error, "Could not load the roadmap.")} onRetry={reload} />
      ) : loading && !data ? (
        <div className="space-y-3">
          <Skeleton className="h-40 rounded-[20px]" />
          <Skeleton className="h-40 rounded-[20px]" />
        </div>
      ) : (
        <>
          {!data || data.chapters.length === 0 ? (
            <EmptyState
              title="No roadmap yet"
              description="Add the first chapter, then topics and lessons. A course needs at least one chapter with a topic before it can be published."
            />
          ) : (
            <div className="space-y-4">
              {data.chapters.map((chapter, i) => (
                <ChapterCard
                  key={chapter.id}
                  courseId={courseId}
                  chapter={chapter}
                  index={i}
                  count={data.chapters.length}
                  reorderTargets={data.chapters.map((c) => c.id)}
                  onChanged={reload}
                />
              ))}
            </div>
          )}
          <AddChapterForm courseId={courseId} onChanged={reload} />
        </>
      )}
    </div>
  );
}

function ChapterCard({
  courseId,
  chapter,
  index,
  count,
  reorderTargets,
  onChanged,
}: {
  courseId: string;
  chapter: ChapterRow;
  index: number;
  count: number;
  reorderTargets: string[];
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(chapter.title);
  const [summary, setSummary] = useState(chapter.summary ?? "");

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (err) {
      setError(rmError(err, "Could not update the chapter."));
    } finally {
      setBusy(false);
    }
  }

  function reorder(dir: -1 | 1) {
    const next = move(reorderTargets, index, dir);
    if (!next) return;
    void run(() => apiPost(`/courses/${courseId}/chapters/reorder`, { orderedIds: next }));
  }

  return (
    <Panel>
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(() => apiPatch(`/courses/chapters/${chapter.id}`, { title: title.trim(), summary: summary.trim() || null })).then(() => setEditing(false));
          }}
          className="space-y-3"
        >
          <label className="block text-sm font-semibold text-ink-700" htmlFor={`ch-title-${chapter.id}`}>Chapter title</label>
          <Input id={`ch-title-${chapter.id}`} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
          <label className="block text-sm font-semibold text-ink-700" htmlFor={`ch-sum-${chapter.id}`}>Summary (optional)</label>
          <textarea
            id={`ch-sum-${chapter.id}`}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={2000}
            rows={2}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={busy}>Save chapter</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setEditing(false); setTitle(chapter.title); setSummary(chapter.summary ?? ""); }}>Cancel</Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-bold text-ink-900">{chapter.title}</h2>
            {chapter.summary && <p className="mt-0.5 text-sm text-slate-500">{chapter.summary}</p>}
            {error && <p role="alert" className="mt-1 text-sm text-red-700">{error}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Button variant="ghost" size="sm" disabled={busy || index === 0} onClick={() => reorder(-1)} aria-label={`Move ${chapter.title} up`}>Move up</Button>
            <Button variant="ghost" size="sm" disabled={busy || index === count - 1} onClick={() => reorder(1)} aria-label={`Move ${chapter.title} down`}>Move down</Button>
            <Button variant="secondary" size="sm" disabled={busy} onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="danger" size="sm" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete</Button>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div role="alertdialog" aria-modal="true" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">Delete “{chapter.title}” and all its topics and lessons? This can’t be undone.</p>
          <div className="mt-2 flex gap-2">
            <Button variant="danger" size="sm" loading={busy} onClick={() => run(() => apiDelete(`/courses/chapters/${chapter.id}`))}>Delete chapter</Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} disabled={busy}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {chapter.topics.map((topic, ti) => (
          <TopicCard
            key={topic.id}
            chapterId={chapter.id}
            topic={topic}
            index={ti}
            count={chapter.topics.length}
            reorderTargets={chapter.topics.map((t) => t.id)}
            onChanged={onChanged}
          />
        ))}
        <AddTopicForm chapterId={chapter.id} onChanged={onChanged} />
      </div>
    </Panel>
  );
}

function TopicCard({
  chapterId,
  topic,
  index,
  count,
  reorderTargets,
  onChanged,
}: {
  chapterId: string;
  topic: TopicRow;
  index: number;
  count: number;
  reorderTargets: string[];
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(topic.title);
  const [summary, setSummary] = useState(topic.summary ?? "");

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (err) {
      setError(rmError(err, "Could not update the topic."));
    } finally {
      setBusy(false);
    }
  }

  function reorder(dir: -1 | 1) {
    const next = move(reorderTargets, index, dir);
    if (!next) return;
    void run(() => apiPost(`/courses/chapters/${chapterId}/topics/reorder`, { orderedIds: next }));
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(() => apiPatch(`/courses/topics/${topic.id}`, { title: title.trim(), summary: summary.trim() || null })).then(() => setEditing(false));
          }}
          className="space-y-3"
        >
          <Input aria-label="Topic title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
          <Input aria-label="Topic summary" value={summary} onChange={(e) => setSummary(e.target.value)} maxLength={2000} placeholder="Summary (optional)" />
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={busy}>Save topic</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setEditing(false); setTitle(topic.title); setSummary(topic.summary ?? ""); }}>Cancel</Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-ink-900">{topic.title}</p>
            {topic.summary && <p className="text-xs text-slate-500">{topic.summary}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Button variant="ghost" size="sm" disabled={busy || index === 0} onClick={() => reorder(-1)} aria-label={`Move ${topic.title} up`}>↑</Button>
            <Button variant="ghost" size="sm" disabled={busy || index === count - 1} onClick={() => reorder(1)} aria-label={`Move ${topic.title} down`}>↓</Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete</Button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      {confirmDelete && (
        <div role="alertdialog" aria-modal="true" className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-sm text-red-700">Delete “{topic.title}” and its lessons?</p>
          <div className="mt-2 flex gap-2">
            <Button variant="danger" size="sm" loading={busy} onClick={() => run(() => apiDelete(`/courses/topics/${topic.id}`))}>Delete topic</Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} disabled={busy}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {topic.lessons.map((lesson, li) => (
          <LessonCard
            key={lesson.id}
            topicId={topic.id}
            lesson={lesson}
            index={li}
            count={topic.lessons.length}
            reorderTargets={topic.lessons.map((l) => l.id)}
            onChanged={onChanged}
          />
        ))}
        <AddLessonForm topicId={topic.id} onChanged={onChanged} />
      </div>
    </div>
  );
}

function LessonCard({
  topicId,
  lesson,
  index,
  count,
  reorderTargets,
  onChanged,
}: {
  topicId: string;
  lesson: LessonRow;
  index: number;
  count: number;
  reorderTargets: string[];
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(lesson.title);
  const [type, setType] = useState<"VIDEO" | "READING">(lesson.type);
  const [contentUrl, setContentUrl] = useState(lesson.contentUrl ?? "");
  const [textContent, setTextContent] = useState(lesson.textContent ?? "");
  const [isPublished, setIsPublished] = useState(lesson.isPublished);

  const urlInvalid = type === "VIDEO" && contentUrl.trim().length > 0 && !isUrl(contentUrl.trim());

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      onChanged();
    } catch (err) {
      setError(rmError(err, "Could not update the lesson."));
    } finally {
      setBusy(false);
    }
  }

  function reorder(dir: -1 | 1) {
    const next = move(reorderTargets, index, dir);
    if (!next) return;
    void run(() => apiPost(`/courses/topics/${topicId}/lessons/reorder`, { orderedIds: next }));
  }

  async function save() {
    if (urlInvalid || title.trim().length < 2) return;
    await run(() =>
      apiPatch(`/courses/lessons/${lesson.id}`, {
        title: title.trim(),
        type,
        contentUrl: type === "VIDEO" && contentUrl.trim() ? contentUrl.trim() : null,
        textContent: type === "READING" && textContent.trim() ? textContent : null,
        isPublished,
      }),
    ).then(() => setEditing(false));
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      {editing ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
          className="space-y-3"
        >
          <Input aria-label="Lesson title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <select
              aria-label="Lesson type"
              value={type}
              onChange={(e) => setType(e.target.value as "VIDEO" | "READING")}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            >
              <option value="READING">READING</option>
              <option value="VIDEO">VIDEO</option>
            </select>
            <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
              <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600/30" />
              Published
            </label>
          </div>
          {type === "VIDEO" ? (
            <div>
              <Input aria-label="Video URL" value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} placeholder="https://…" error={urlInvalid} />
              {urlInvalid && <p className="mt-1 text-xs text-red-600">Enter a valid URL.</p>}
            </div>
          ) : (
            <textarea
              aria-label="Lesson text"
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
              rows={5}
              maxLength={100000}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
              placeholder="Lesson content"
            />
          )}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" loading={busy}>Save lesson</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <StatusPill tone={lesson.isPublished ? "success" : "warn"}>{lesson.isPublished ? "Published" : "Draft"}</StatusPill>
            <span className="truncate text-sm font-medium text-ink-900">{lesson.title}</span>
            <span className="text-xs text-slate-400">{lesson.type}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Button variant="ghost" size="sm" disabled={busy || index === 0} onClick={() => reorder(-1)} aria-label={`Move ${lesson.title} up`}>↑</Button>
            <Button variant="ghost" size="sm" disabled={busy || index === count - 1} onClick={() => reorder(1)} aria-label={`Move ${lesson.title} down`}>↓</Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => setEditing(true)}>Edit</Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmDelete(true)}>Delete</Button>
          </div>
        </div>
      )}
      {error && !editing && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
      {confirmDelete && (
        <div role="alertdialog" aria-modal="true" className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <p className="text-sm text-red-700">Delete “{lesson.title}”?</p>
          <div className="mt-2 flex gap-2">
            <Button variant="danger" size="sm" loading={busy} onClick={() => run(() => apiDelete(`/courses/lessons/${lesson.id}`))}>Delete lesson</Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)} disabled={busy}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddChapterForm({ courseId, onChanged }: { courseId: string; onChanged: () => void }) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Panel title="Add chapter">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (busy || title.trim().length < 2) return;
          setBusy(true);
          setError(null);
          try {
            await apiPost(`/courses/${courseId}/chapters`, { title: title.trim() });
            setTitle("");
            notifySuccess("Chapter added");
            onChanged();
          } catch (err) {
            setError(rmError(err, "Could not add the chapter."));
          } finally {
            setBusy(false);
          }
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <div className="min-w-[240px] flex-1">
          <label htmlFor="new-chapter" className="mb-1 block text-sm font-semibold text-ink-700">Chapter title</label>
          <Input id="new-chapter" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required />
        </div>
        <Button type="submit" size="sm" loading={busy} disabled={title.trim().length < 2}>Add chapter</Button>
        {error && <p role="alert" className="w-full text-sm text-red-700">{error}</p>}
      </form>
    </Panel>
  );
}

function AddTopicForm({ chapterId, onChanged }: { chapterId: string; onChanged: () => void }) {
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const id = `new-topic-${chapterId}`;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (busy || title.trim().length < 2) return;
        setBusy(true);
        setError(null);
        try {
          await apiPost(`/courses/chapters/${chapterId}/topics`, { title: title.trim() });
          setTitle("");
          notifySuccess("Topic added");
          onChanged();
        } catch (err) {
          setError(rmError(err, "Could not add the topic."));
        } finally {
          setBusy(false);
        }
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <div className="min-w-[200px] flex-1">
        <label htmlFor={id} className="mb-1 block text-xs font-semibold text-ink-700">New topic</label>
        <Input id={id} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder="Topic title" required />
      </div>
      <Button type="submit" variant="secondary" size="sm" loading={busy} disabled={title.trim().length < 2}>Add topic</Button>
      {error && <p role="alert" className="w-full text-sm text-red-700">{error}</p>}
    </form>
  );
}

function AddLessonForm({ topicId, onChanged }: { topicId: string; onChanged: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"VIDEO" | "READING">("READING");
  const [contentUrl, setContentUrl] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlInvalid = type === "VIDEO" && contentUrl.trim().length > 0 && !isUrl(contentUrl.trim());
  const valid = title.trim().length >= 2 && !urlInvalid;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !valid) return;
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/courses/topics/${topicId}/lessons`, {
        title: title.trim(),
        type,
        contentUrl: type === "VIDEO" && contentUrl.trim() ? contentUrl.trim() : null,
        textContent: type === "READING" && textContent.trim() ? textContent : null,
        isPublished,
      });
      setTitle("");
      setContentUrl("");
      setTextContent("");
      setIsPublished(false);
      notifySuccess("Lesson added");
      onChanged();
    } catch (err) {
      setError(rmError(err, "Could not add the lesson."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="rounded-lg border border-dashed border-slate-300 bg-white p-3">
      <summary className="cursor-pointer text-sm font-semibold text-brand-700">Add lesson</summary>
      <form onSubmit={submit} className="mt-3 space-y-3" noValidate>
        <Input aria-label="New lesson title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder="Lesson title" required />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            aria-label="Lesson type"
            value={type}
            onChange={(e) => setType(e.target.value as "VIDEO" | "READING")}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          >
            <option value="READING">READING</option>
            <option value="VIDEO">VIDEO</option>
          </select>
          <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600/30" />
            Publish immediately
          </label>
        </div>
        {type === "VIDEO" ? (
          <div>
            <Input aria-label="Video URL" value={contentUrl} onChange={(e) => setContentUrl(e.target.value)} placeholder="https://…" error={urlInvalid} />
            {urlInvalid && <p className="mt-1 text-xs text-red-600">Enter a valid URL.</p>}
          </div>
        ) : (
          <textarea
            aria-label="Lesson text"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            rows={4}
            maxLength={100000}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            placeholder="Lesson content"
          />
        )}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" size="sm" loading={busy} disabled={!valid}>Add lesson</Button>
        </div>
      </form>
    </details>
  );
}
