"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { useCourseRoadmap } from "./useCourseRoadmap";
import type { ResourceRow } from "@/lib/app-types";
import { cn } from "@/lib/cn";
import { notifyError, notifySuccess } from "@/lib/notify";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Button, { buttonClass } from "@/components/ui/Button";

const ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,.png,.jpg,.jpeg,.webp,.gif,.svg,.mp4,.webm";
const MAX_BYTES = 5 * 1024 * 1024;

interface TopicOpt {
  id: string;
  title: string;
  chapterTitle: string;
}

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

export default function CourseResources({ slug }: { slug: string }) {
  const { detail, roadmap, loading, error, reload } = useCourseRoadmap(slug);

  const [resources, setResources] = useState<ResourceRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState("pdf");
  const [topicId, setTopicId] = useState("");
  const [mode, setMode] = useState<"file" | "link">("file");
  const [file, setFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPublished, setEditPublished] = useState(true);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const courseId = detail?.course.id;
  const isStaff = Boolean(detail?.access.isStaff);

  const loadResources = useCallback(async () => {
    setListError(null);
    try {
      const { resources: list } = await apiGet<{ resources: ResourceRow[] }>("/resources");
      setResources(list);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Could not load resources.");
    }
  }, []);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const topics: TopicOpt[] = useMemo(
    () =>
      (roadmap?.chapters ?? []).flatMap((ch) =>
        ch.topics.map((t) => ({ id: t.id, title: t.title, chapterTitle: ch.title })),
      ),
    [roadmap],
  );

  const courseResources = useMemo(() => {
    if (!resources || !courseId) return [];
    return resources.filter((r) => r.courseId === courseId && (isStaff || r.isPublished));
  }, [resources, courseId, isStaff]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !courseId) return;
    if (title.trim().length < 2) return setFormError("Title needs at least 2 characters.");
    if (mode === "file" && !file) return setFormError("Choose a file to upload.");
    if (mode === "link") {
      try {
        new URL(linkUrl.trim());
      } catch {
        return setFormError("Enter a valid URL.");
      }
    }
    if (mode === "file" && file && file.size > MAX_BYTES) return setFormError("File must be 5 MB or smaller.");
    setFormError(null);
    setBusy(true);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim() ? description.trim() : null,
        kind: kind.trim() || "pdf",
        courseId,
        topicId: topicId || null,
        linkUrl: mode === "link" ? linkUrl.trim() : null,
        file: null,
      };
      if (mode === "file" && file) {
        const data = await fileToBase64(file);
        payload.file = { name: file.name, type: file.type, data };
      }
      await apiPost("/resources", payload);
      notifySuccess("Resource posted.");
      setTitle("");
      setDescription("");
      setKind("pdf");
      setTopicId("");
      setFile(null);
      setLinkUrl("");
      await loadResources();
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "Could not post the resource.");
    } finally {
      setBusy(false);
    }
  }

  function startEdit(r: ResourceRow) {
    setEditingId(r.id);
    setEditTitle(r.title);
    setEditDescription(r.description ?? "");
    setEditPublished(r.isPublished);
  }

  async function saveEdit(id: string) {
    if (editTitle.trim().length < 2) {
      notifyError("Title needs at least 2 characters.");
      return;
    }
    setRowBusy(id);
    try {
      await apiPatch(`/resources/${id}`, {
        title: editTitle.trim(),
        description: editDescription.trim() ? editDescription.trim() : null,
        isPublished: editPublished,
      });
      notifySuccess("Resource updated.");
      setEditingId(null);
      await loadResources();
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "Could not update the resource.");
    } finally {
      setRowBusy(null);
    }
  }

  async function remove(r: ResourceRow) {
    if (!confirm(`Delete "${r.title}"? This removes the file and cannot be undone.`)) return;
    setRowBusy(r.id);
    try {
      await apiDelete(`/resources/${r.id}`);
      notifySuccess("Resource deleted.");
      await loadResources();
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "Could not delete the resource.");
    } finally {
      setRowBusy(null);
    }
  }

  if (loading) return <Spinner label="Loading resources…" />;
  if (error) return <ErrorState message={error} onRetry={() => void reload()} />;
  if (!detail) return null;

  if (!detail.access.canRead) {
    return (
      <EmptyState
        title="Resources are locked"
        description="Enroll in this course to see its resources."
        action={
          <Link href={`/courses/${slug}`} className={buttonClass("secondary", "sm")}>
            View course
          </Link>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-ink-900">Resources</h2>
          <p className="mt-1 text-sm text-slate-500">
            {isStaff ? "Post files and links for this course. Attach them to a topic in the roadmap." : "Files and links shared for this course."}
          </p>
        </div>
      </header>

      {isStaff && (
        <section aria-labelledby="post-resource-h" className="rounded-[20px] border border-slate-200 bg-white p-5">
          <h3 id="post-resource-h" className="font-display text-lg font-bold text-ink-900">
            Post a resource
          </h3>
          <form onSubmit={create} className="mt-4 flex flex-col gap-3">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" aria-label="Resource title" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Description (optional)"
              aria-label="Resource description"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-semibold text-ink-700">Type</span>
                <Input value={kind} onChange={(e) => setKind(e.target.value)} placeholder="pdf, slides, video, link…" />
              </label>
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
            </div>

            <fieldset className="flex flex-wrap gap-4 text-sm">
              <legend className="font-semibold text-ink-700">Source</legend>
              <label className="flex items-center gap-2">
                <input type="radio" name="mode" checked={mode === "file"} onChange={() => setMode("file")} /> Upload file
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="mode" checked={mode === "link"} onChange={() => setMode("link")} /> External link
              </label>
            </fieldset>

            {mode === "file" ? (
              <div>
                <Input
                  type="file"
                  accept={ACCEPT}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  aria-label="Resource file"
                  className="py-2"
                />
                <p className="mt-1 text-xs text-slate-400">Up to 5 MB. Type is validated by the server.</p>
              </div>
            ) : (
              <Input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://…" aria-label="Resource link" />
            )}

            {formError && <p className="text-sm text-danger">{formError}</p>}
            <div>
              <Button type="submit" size="sm" loading={busy}>
                Post
              </Button>
            </div>
          </form>
        </section>
      )}

      <section aria-labelledby="course-resources-h">
        <h3 id="course-resources-h" className="font-display text-lg font-bold text-ink-900">
          {isStaff ? "Course resources" : "Shared with you"}
        </h3>

        {listError ? (
          <div className="mt-3">
            <ErrorState message={listError} onRetry={() => void loadResources()} />
          </div>
        ) : !resources ? (
          <Spinner label="Loading resources…" />
        ) : courseResources.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              title="No resources yet"
              description={isStaff ? "Post the first resource for this course above." : "Your mentor has not shared resources yet."}
            />
          </div>
        ) : (
          <ul className="mt-3 grid gap-4 sm:grid-cols-2">
            {courseResources.map((r) => (
              <li key={r.id} className="rounded-[20px] border border-slate-200 bg-white p-5">
                {editingId === r.id ? (
                  <div className="flex flex-col gap-3">
                    <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} aria-label="Resource title" />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={2}
                      aria-label="Resource description"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                    />
                    <label className="flex items-center gap-2 text-sm text-ink-700">
                      <input type="checkbox" checked={editPublished} onChange={(e) => setEditPublished(e.target.checked)} />
                      Published
                    </label>
                    <div className="flex gap-2">
                      <Button size="sm" loading={rowBusy === r.id} onClick={() => void saveEdit(r.id)}>
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{r.kind}</span>
                    <span className="mt-1 font-display text-lg font-bold text-ink-900">{r.title}</span>
                    {r.description && <span className="mt-1 line-clamp-2 text-sm text-slate-600">{r.description}</span>}
                    <span className="mt-2 text-sm text-slate-500">
                      {r.storagePath ? "File" : r.url ? "Link" : "Resource"}
                      {!r.isPublished && <span className="text-amber-700"> · Draft</span>}
                    </span>
                    <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                      <Link href={`/dashboard/resources/${r.id}`} className={buttonClass("secondary", "sm")}>
                        Open
                      </Link>
                      {isStaff && (
                        <>
                          <button type="button" className={buttonClass("ghost", "sm")} onClick={() => startEdit(r)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className={cn(buttonClass("ghost", "sm"), "text-danger")}
                            onClick={() => void remove(r)}
                            disabled={rowBusy === r.id}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
