"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiError, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { CourseDetailResponse } from "@/lib/app-types";
import { notifySuccess } from "@/lib/notify";
import { formatMoney } from "@/lib/format";
import Button, { buttonClass } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { AdminHeader, Panel, Skeleton, StatusPill, statusTone, useAsync } from "./admin-ui";

const MAX_PAISE = 10_000_000;

interface EditorCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  gradeLevel: string | null;
  pricePaise: number;
  currency: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  thumbnailUrl: string | null;
}

function editorError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.code === "ROADMAP_INCOMPLETE") return "Add at least one chapter with a topic before publishing.";
    if (err.code === "HAS_ORDERS") return "Paid orders exist — archive the course instead of deleting.";
    if (err.code === "HAS_PARTICIPANTS") return "Enrolled participants exist — archive the course instead.";
    if (err.code === "INVALID_TRANSITION") return err.message;
    if (err.code === "FORBIDDEN" || err.status === 403) return "You don’t have permission to edit this course.";
    if (err.code === "UNAUTHORIZED" || err.status === 401) return "Your session expired. Please sign in again.";
    if (err.code === "VALIDATION_ERROR") return err.message || "Please check the details and try again.";
    if (err.code === "RATE_LIMITED" || err.status === 429) return "Too many requests. Please wait a moment.";
  }
  return err instanceof Error ? err.message : fallback;
}

export default function AdminCourseEditor({ courseId }: { courseId: string | null }) {
  return courseId ? <EditLoader id={courseId} /> : <NewCourseEditor />;
}

function EditLoader({ id }: { id: string }) {
  const { data, error, loading, reload } = useAsync(() => apiGet<CourseDetailResponse>(`/courses/${id}`), [id]);

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-96 rounded-[20px]" />
      </div>
    );
  }
  if (error) return <ErrorState message={editorError(error, "Could not load this course.")} onRetry={reload} />;
  if (!data) {
    return <EmptyState title="Course not found" description="This course may have been removed." action={<Link href="/dashboard/admin/courses" className={buttonClass("secondary", "sm")}>Back to courses</Link>} />;
  }

  const c = data.course;
  const initial: EditorCourse = {
    id: c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    gradeLevel: c.gradeLevel,
    pricePaise: c.pricePaise,
    currency: c.currency,
    status: c.status as EditorCourse["status"],
    thumbnailUrl: c.thumbnailUrl,
  };
  return <CourseForm initial={initial} mode="edit" onSaved={reload} />;
}

function NewCourseEditor() {
  const initial: EditorCourse = {
    id: "",
    title: "",
    description: "",
    category: "",
    gradeLevel: null,
    pricePaise: 0,
    currency: "INR",
    status: "DRAFT",
    thumbnailUrl: null,
  };
  return <CourseForm initial={initial} mode="create" />;
}

function CourseForm({
  initial,
  mode,
  onSaved,
}: {
  initial: EditorCourse;
  mode: "create" | "edit";
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [category, setCategory] = useState(initial.category);
  const [gradeLevel, setGradeLevel] = useState(initial.gradeLevel ?? "");
  const [priceRupees, setPriceRupees] = useState(initial.pricePaise ? String(initial.pricePaise / 100) : "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial.thumbnailUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const dirty =
    title !== initial.title ||
    description !== initial.description ||
    category !== initial.category ||
    gradeLevel !== (initial.gradeLevel ?? "") ||
    priceRupees !== (initial.pricePaise ? String(initial.pricePaise / 100) : "") ||
    thumbnailUrl !== (initial.thumbnailUrl ?? "");

  const pricePaise = parsePrice(priceRupees);
  const priceInvalid = pricePaise === null;
  const urlInvalid = thumbnailUrl.trim().length > 0 && !isUrl(thumbnailUrl.trim());
  const formValid =
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    !priceInvalid &&
    !urlInvalid;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !formValid) return;
    setSaving(true);
    setError(null);
    setNotice(null);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category: category.trim() || "General",
      gradeLevel: gradeLevel.trim() || null,
      pricePaise: pricePaise as number,
      thumbnailUrl: thumbnailUrl.trim() || null,
    };

    try {
      if (mode === "create") {
        const { course } = await apiPost<{ course: { id: string } }>("/courses", payload);
        notifySuccess("Course created");
        router.push(`/dashboard/admin/courses/${course.id}`);
      } else {
        await apiPatch(`/courses/${initial.id}`, payload);
        notifySuccess("Course saved");
        setNotice("Saved.");
        onSaved?.();
      }
    } catch (err) {
      setError(editorError(err, "Could not save the course."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title={mode === "create" ? "New course" : initial.title || "Edit course"}
        description={
          mode === "create"
            ? "Create a draft course. Add its roadmap, then publish from the editor."
            : `Editing · ${initial.status.toLowerCase()}. Price is entered in rupees; stored as integer paise.`
        }
        actions={
          <Link href="/dashboard/admin/courses" className="text-sm font-semibold text-brand-700 hover:underline">
            ← All courses
          </Link>
        }
      />

      {mode === "edit" && (
        <EditHeader course={initial} onSaved={onSaved} />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <form onSubmit={submit} className="space-y-5 lg:col-span-2" noValidate>
          <Panel title="Course details">
            {error && (
              <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {notice && !error && (
              <p role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {notice}
              </p>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="c-title" className="mb-1 block text-sm font-semibold text-ink-700">Title</label>
                <Input id="c-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} required error={title.length > 0 && title.trim().length < 3} />
                <p className="mt-1 text-xs text-slate-500">3–160 characters. Changing the title updates the URL slug.</p>
              </div>
              <div>
                <label htmlFor="c-desc" className="mb-1 block text-sm font-semibold text-ink-700">Description</label>
                <textarea
                  id="c-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={8000}
                  rows={8}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                />
                <p className="mt-1 text-xs text-slate-500">10–8000 characters.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-category" className="mb-1 block text-sm font-semibold text-ink-700">Category</label>
                  <Input id="c-category" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={60} placeholder="General" />
                </div>
                <div>
                  <label htmlFor="c-grade" className="mb-1 block text-sm font-semibold text-ink-700">Grade level</label>
                  <Input id="c-grade" value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} maxLength={40} placeholder="Optional" />
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="c-price" className="mb-1 block text-sm font-semibold text-ink-700">Price (₹)</label>
                  <Input
                    id="c-price"
                    type="number"
                    min={0}
                    step="0.01"
                    value={priceRupees}
                    onChange={(e) => setPriceRupees(e.target.value)}
                    error={priceInvalid}
                    placeholder="0 for free"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {priceInvalid ? "Enter a valid amount between ₹0 and ₹1,00,000." : `Stored as ${pricePaise?.toLocaleString("en-IN")} paise.`}
                  </p>
                </div>
                <div>
                  <label htmlFor="c-thumb" className="mb-1 block text-sm font-semibold text-ink-700">Thumbnail URL</label>
                  <Input id="c-thumb" type="url" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} error={urlInvalid} placeholder="https://…" />
                  <p className="mt-1 text-xs text-slate-500">{urlInvalid ? "Enter a valid URL or leave blank." : "Optional image URL."}</p>
                </div>
              </div>
            </div>
          </Panel>

          <div className="flex justify-end gap-2">
            <Link href="/dashboard/admin/courses" className={buttonClass("ghost", "sm")}>
              Cancel
            </Link>
            <Button type="submit" loading={saving} disabled={!formValid || (mode === "edit" && !dirty)}>
              {mode === "create" ? "Create course" : "Save changes"}
            </Button>
          </div>
        </form>

        <div className="space-y-6">
          {mode === "edit" && (
            <Panel title="Roadmap" description="Structure the course into chapters, topics and lessons.">
              <div className="flex flex-wrap gap-2">
                <Link href={`/dashboard/admin/courses/${initial.id}/roadmap`} className={buttonClass("secondary", "sm")}>
                  Open roadmap builder
                </Link>
                <Link href={`/dashboard/admin/courses/${initial.id}/participants`} className={buttonClass("secondary", "sm")}>
                  View participants
                </Link>
              </div>
            </Panel>
          )}
          <Panel title="Preview">
            <p className="text-sm text-slate-500">
              Current price: <strong className="text-ink-900">{priceInvalid ? "—" : formatMoney(pricePaise ?? 0, initial.currency)}</strong>
            </p>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function EditHeader({ course, onSaved }: { course: EditorCourse; onSaved?: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | { next: EditorCourse["status"]; label: string; detail: string }>(null);

  async function apply(next: EditorCourse["status"]) {
    setBusy(true);
    setError(null);
    try {
      await apiPatch(`/courses/${course.id}`, { status: next });
      notifySuccess(`Course moved to ${next.toLowerCase()}`);
      setConfirm(null);
      onSaved?.();
    } catch (err) {
      setError(editorError(err, "Could not update the course status."));
    } finally {
      setBusy(false);
    }
  }

  const options: { label: string; next: EditorCourse["status"]; detail: string }[] =
    course.status === "DRAFT"
      ? [
          { label: "Publish", next: "PUBLISHED", detail: "Learners will see this course in the catalogue." },
          { label: "Archive", next: "ARCHIVED", detail: "It stays in the system but is hidden from learners." },
        ]
      : course.status === "PUBLISHED"
        ? [
            { label: "Unpublish", next: "DRAFT", detail: "It will be hidden from the catalogue until republished." },
            { label: "Archive", next: "ARCHIVED", detail: "It stays in the system but is hidden from learners." },
          ]
        : [{ label: "Restore to draft", next: "DRAFT", detail: "It becomes editable again." }];

  return (
    <Panel
      title="Publication"
      description={`Current status: ${course.status.toLowerCase()}.`}
      actions={<StatusPill tone={statusTone(course.status)}>{course.status.toLowerCase()}</StatusPill>}
    >
      {error && (
        <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Button key={o.label} variant="secondary" size="sm" disabled={busy} onClick={() => setConfirm(o)}>
            {o.label}
          </Button>
        ))}
      </div>
      {confirm && (
        <div role="alertdialog" aria-modal="true" aria-label={`Confirm ${confirm.label}`} className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-900">{confirm.detail}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" loading={busy} onClick={() => apply(confirm.next)}>
              Confirm {confirm.label.toLowerCase()}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirm(null)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
}

function parsePrice(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return 0;
  const rupees = Number(trimmed);
  if (!Number.isFinite(rupees) || rupees < 0) return null;
  const paise = Math.round(rupees * 100);
  if (paise > MAX_PAISE) return null;
  return paise;
}

function isUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
