"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import type { ResourceRow, MyCourses } from "@/lib/app-types";
import { cn } from "@/lib/cn";
import { notifyError, notifySuccess } from "@/lib/notify";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Button, { buttonClass } from "@/components/ui/Button";

const ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip,.png,.jpg,.jpeg,.webp,.gif,.svg,.mp4,.webm";
const MAX_BYTES = 5 * 1024 * 1024;

interface CourseOpt {
  id: string;
  title: string;
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

export default function ResourceManager() {
  const { user } = useAuth();
  const [resources, setResources] = useState<ResourceRow[] | null>(null);
  const [staffCourses, setStaffCourses] = useState<CourseOpt[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState("pdf");
  const [courseId, setCourseId] = useState("");
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

  const load = useCallback(async () => {
    setError(null);
    try {
      const [list, mine] = await Promise.all([
        apiGet<{ resources: ResourceRow[] }>("/resources"),
        apiGet<MyCourses>("/courses/mine"),
      ]);
      setResources(list.resources);
      setStaffCourses(mine.mentoring.map((m) => ({ id: m.course.id, title: m.course.title })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your resources.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const staffIds = useMemo(() => new Set(staffCourses.map((c) => c.id)), [staffCourses]);

  const manageable = useMemo(() => {
    if (!resources || !user) return [];
    return resources.filter(
      (r) => r.ownerId === user.id || user.role === "ADMIN" || (r.courseId && staffIds.has(r.courseId)),
    );
  }, [resources, user, staffIds]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
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
        courseId: courseId || null,
        linkUrl: mode === "link" ? linkUrl.trim() : null,
        file: null,
      };
      if (mode === "file" && file) {
        const data = await fileToBase64(file);
        payload.file = { name: file.name, type: file.type, data };
      }
      await apiPost("/resources", payload);
      notifySuccess("Resource uploaded.");
      setTitle("");
      setDescription("");
      setKind("pdf");
      setCourseId("");
      setFile(null);
      setLinkUrl("");
      await load();
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "Could not upload the resource.");
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
      await load();
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
      await load();
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "Could not delete the resource.");
    } finally {
      setRowBusy(null);
    }
  }

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!resources) return <Spinner label="Loading resources…" />;

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Manage resources</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload files or links. Course resources require mentor or owner access to that course.
          </p>
        </div>
        <Link href="/dashboard/resources" className={buttonClass("secondary", "sm")}>
          Back to library
        </Link>
      </header>

      <section aria-labelledby="upload-h" className="rounded-[20px] border border-slate-200 bg-white p-5">
        <h2 id="upload-h" className="font-display text-lg font-bold text-ink-900">
          Upload a resource
        </h2>
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
              <span className="font-semibold text-ink-700">Course</span>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
              >
                <option value="">General library (no course)</option>
                {staffCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
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
              Upload
            </Button>
          </div>
        </form>
      </section>

      <section aria-labelledby="mine-h">
        <h2 id="mine-h" className="font-display text-lg font-bold text-ink-900">
          Your manageable resources
        </h2>
        {manageable.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="Nothing to manage" description="Resources you upload or manage for your courses appear here." />
          </div>
        ) : (
          <ul className="mt-3 flex flex-col divide-y divide-slate-200 rounded-[20px] border border-slate-200 bg-white">
            {manageable.map((r) => (
              <li key={r.id} className="p-4 sm:p-5">
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
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900">{r.title}</p>
                      <p className="mt-0.5 text-sm text-slate-500">
                        {r.kind} · {r.course ? r.course.title : "General"}
                        {r.storagePath ? " · file" : r.url ? " · link" : ""}
                        {!r.isPublished && <span className="text-amber-700"> · Draft</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/resources/${r.id}`} className={buttonClass("ghost", "sm")}>
                        View
                      </Link>
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
