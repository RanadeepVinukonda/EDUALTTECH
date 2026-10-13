"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiError, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { CourseDetailResponse } from "@/lib/app-types";
import { notifySuccess } from "@/lib/notify";
import { formatMoney } from "@/lib/format";
import Button, { buttonClass } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Title from "@mui/icons-material/Title";
import Category from "@mui/icons-material/Category";
import Insights from "@mui/icons-material/Insights";
import CurrencyRupee from "@mui/icons-material/CurrencyRupee";
import School from "@mui/icons-material/School";
import Image from "@mui/icons-material/Image";
import Language from "@mui/icons-material/Language";
import Close from "@mui/icons-material/Close";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { AdminHeader, Panel, Skeleton, StatusPill, statusTone, useAsync } from "./admin-ui";
import { MediaPicker, MediaReference } from "./cms-ui";
import AdminRoadmapBuilder from "./AdminRoadmapBuilder";
import AdminParticipants from "./AdminParticipants";

const MAX_PAISE = 10_000_000;

const FEATURE_HINTS = ["e.g. 8 chapters", "e.g. 42 lessons", "e.g. Beginner friendly", "e.g. Certificate included"];

type CourseWorkspaceTab = "details" | "roadmap" | "participants";

const WORKSPACE_TABS: { key: CourseWorkspaceTab; label: string }[] = [
  { key: "details", label: "Details" },
  { key: "roadmap", label: "Roadmap" },
  { key: "participants", label: "Participants" },
];

interface EditorCourse {
  id: string;
  title: string;
  description: string;
  type: "EDUCATION" | "ALTERNATIVE_EDUCATION";
  category: string;
  domain: string;
  features: string[];
  level: string | null;
  tags: string[];
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

function toWorkspaceTab(value: string | undefined): CourseWorkspaceTab {
  return value === "roadmap" || value === "participants" ? value : "details";
}

export default function AdminCourseEditor({ courseId, tab }: { courseId: string | null; tab?: string }) {
  return courseId ? <EditWorkspace id={courseId} initialTab={toWorkspaceTab(tab)} /> : <NewCourseEditor />;
}

function EditWorkspace({ id, initialTab }: { id: string; initialTab: CourseWorkspaceTab }) {
  const router = useRouter();
  const { data, error, loading, reload } = useAsync(() => apiGet<CourseDetailResponse>(`/courses/${id}`), [id]);
  const [tab, setTab] = useState<CourseWorkspaceTab>(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  function switchTab(next: CourseWorkspaceTab) {
    setTab(next);
    router.replace(`/dashboard/admin/courses/${id}?tab=${next}`, { scroll: false });
  }

  if (loading && !data) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-10 w-80 rounded-xl" />
        <Skeleton className="h-96 rounded-[20px]" />
      </div>
    );
  }
  if (error) return <ErrorState message={editorError(error, "Could not load this course.")} onRetry={reload} />;
  if (!data) {
    return (
      <EmptyState
        title="Course not found"
        description="This course may have been removed."
        action={
          <Link href="/dashboard/admin/courses" className={buttonClass("secondary", "sm")}>
            Back to courses
          </Link>
        }
      />
    );
  }

  const c = data.course;
  const initial: EditorCourse = {
    id: c.id,
    title: c.title,
    description: c.description,
    category: c.category,
    type: c.type ?? "EDUCATION",
    domain: c.domain,
    features: c.features ?? [],
    level: c.level,
    tags: c.tags ?? [],
    pricePaise: c.pricePaise,
    currency: c.currency,
    status: c.status as EditorCourse["status"],
    thumbnailUrl: c.thumbnailUrl,
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title={c.title || "Edit course"}
        description={`Editing · ${initial.status.toLowerCase()}. Price is entered in rupees; stored as integer paise.`}
        actions={
          <Link href="/dashboard/admin/courses" className="text-sm font-semibold text-brand-700 hover:underline">
            ← All courses
          </Link>
        }
      />

      <CourseTabs active={tab} onChange={switchTab} />

      {tab === "details" && <CourseForm initial={initial} mode="edit" onSaved={reload} />}
      {tab === "roadmap" && <AdminRoadmapBuilder courseId={id} courseTitle={c.title} embedded />}
      {tab === "participants" && <AdminParticipants courseId={id} embedded />}
    </div>
  );
}

function CourseTabs({ active, onChange }: { active: CourseWorkspaceTab; onChange: (tab: CourseWorkspaceTab) => void }) {
  return (
    <nav
      aria-label="Course workspace"
      className="flex w-fit max-w-full flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-elev1"
    >
      {WORKSPACE_TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          aria-current={active === t.key ? "page" : undefined}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            active === t.key
              ? "bg-brand-600 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100 hover:text-ink-900"
          }`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

function NewCourseEditor() {
  const initial: EditorCourse = {
    id: "",
    title: "",
    description: "",
    type: "EDUCATION",
    category: "",
    domain: "",
    features: [],
    level: null,
    tags: [],
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
  const [type, setType] = useState<EditorCourse["type"]>(initial.type);
  const [category, setCategory] = useState(initial.category);
  const [domain, setDomain] = useState(initial.domain);
  const [features, setFeatures] = useState<string[]>(() => {
    const f = initial.features ?? [];
    return [f[0] ?? "", f[1] ?? "", f[2] ?? "", f[3] ?? ""];
  });
  const [level, setLevel] = useState(initial.level ?? "");
  const [tags, setTags] = useState<string[]>(initial.tags);
  const [tagDraft, setTagDraft] = useState("");
  const [priceRupees, setPriceRupees] = useState(initial.pricePaise ? String(initial.pricePaise / 100) : "");
  const [thumbnailUrl, setThumbnailUrl] = useState(initial.thumbnailUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);

  const dirty =
    title !== initial.title ||
    description !== initial.description ||
    type !== initial.type ||
    category !== initial.category ||
    domain !== initial.domain ||
    JSON.stringify(features) !== JSON.stringify(normalizeFeatures(initial.features)) ||
    level !== (initial.level ?? "") ||
    JSON.stringify(tags) !== JSON.stringify(initial.tags) ||
    priceRupees !== (initial.pricePaise ? String(initial.pricePaise / 100) : "") ||
    thumbnailUrl !== (initial.thumbnailUrl ?? "");

  const pricePaise = parsePrice(priceRupees);
  const priceInvalid = pricePaise === null;
  const urlInvalid = thumbnailUrl.trim().length > 0 && !isUrl(thumbnailUrl.trim());
  const thumbMissing = thumbnailUrl.trim().length === 0;
  const featureList = features.map((f) => f.trim()).filter(Boolean);
  const formValid =
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    domain.trim().length >= 2 &&
    featureList.length >= 1 &&
    !priceInvalid &&
    !urlInvalid &&
    !thumbMissing;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !formValid) return;
    setSaving(true);
    setError(null);
    setNotice(null);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      type,
      category: category.trim() || "General",
      domain: domain.trim(),
      features: featureList,
      level: level || null,
      tags: withDraftTag(tags, tagDraft),
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

  function commitTag(raw: string) {
    const t = raw.trim();
    if (!t) {
      setTagDraft("");
      return;
    }
    setTags((prev) =>
      prev.length >= 20 || prev.some((x) => x.toLowerCase() === t.toLowerCase()) ? prev : [...prev, t.slice(0, 30)],
    );
    setTagDraft("");
  }

  return (
    <div className="space-y-6">
      {mode === "create" && (
        <AdminHeader
          title="New course"
          description="Create a draft course. Add its roadmap, then publish from the editor."
          actions={
            <Link href="/dashboard/admin/courses" className="text-sm font-semibold text-brand-700 hover:underline">
              ← All courses
            </Link>
          }
        />
      )}

      {mode === "edit" && <EditHeader course={initial} onSaved={onSaved} />}

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
                <Input id="c-title" value={title} icon={<Title fontSize="small" />} onChange={(e) => setTitle(e.target.value)} maxLength={160} required error={title.length > 0 && title.trim().length < 3} />
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
                  <label htmlFor="c-type" className="mb-1 block text-sm font-semibold text-ink-700">Type</label>
                  <Select id="c-type" value={type} icon={<School fontSize="small" />} onChange={(e) => setType(e.target.value as EditorCourse["type"])}>
                    <option value="EDUCATION">Education</option>
                    <option value="ALTERNATIVE_EDUCATION">Alternative education</option>
                  </Select>
                </div>
                <div>
                  <label htmlFor="c-domain" className="mb-1 block text-sm font-semibold text-ink-700">
                    Domain <span className="text-danger">*</span>
                  </label>
                  <Input id="c-domain" value={domain} icon={<Language fontSize="small" />} onChange={(e) => setDomain(e.target.value)} maxLength={60} required error={domain.length > 0 && domain.trim().length < 2} placeholder="Web Development, AI, Design…" />
                  <p className="mt-1 text-xs text-slate-500">Shown as the chip on the course card. Required.</p>
                </div>
                <div>
                  <label htmlFor="c-category" className="mb-1 block text-sm font-semibold text-ink-700">Category</label>
                  <Input id="c-category" value={category} icon={<Category fontSize="small" />} onChange={(e) => setCategory(e.target.value)} maxLength={60} placeholder="Programming, Design, Music…" />
                </div>
                <div>
                  <label htmlFor="c-level" className="mb-1 block text-sm font-semibold text-ink-700">Level</label>
                  <Select id="c-level" value={level} icon={<Insights fontSize="small" />} onChange={(e) => setLevel(e.target.value)}>
                    <option value="">Optional</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </Select>
                </div>
              </div>
              <div>
                <label htmlFor="c-tags" className="mb-1 block text-sm font-semibold text-ink-700">Tags</label>
                {tags.length > 0 && (
                  <ul className="mb-2 flex flex-wrap gap-2">
                    {tags.map((t) => (
                      <li key={t} className="inline-flex items-center gap-1 rounded-full bg-brand-50 py-1 pl-3 pr-1.5 text-xs font-semibold text-brand-700">
                        {t}
                        <button
                          type="button"
                          aria-label={`Remove ${t}`}
                          onClick={() => setTags((prev) => prev.filter((x) => x !== t))}
                          className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-brand-100"
                        >
                          <Close style={{ fontSize: 14 }} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <Input
                  id="c-tags"
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      commitTag(tagDraft);
                    } else if (e.key === "Backspace" && tagDraft === "" && tags.length > 0) {
                      setTags((prev) => prev.slice(0, -1));
                    }
                  }}
                  maxLength={32}
                  placeholder="e.g. 2D Graphics, Game Dev — press Enter"
                />
                <p className="mt-1 text-xs text-slate-500">Topic tags like “2D Graphics”, “Game Dev”. Up to 20.</p>
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink-700">
                  Features <span className="text-danger">*</span>
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {features.map((f, i) => (
                    <Input
                      key={i}
                      value={f}
                      onChange={(e) => setFeatures((prev) => prev.map((v, idx) => (idx === i ? e.target.value : v)))}
                      maxLength={40}
                      placeholder={FEATURE_HINTS[i]}
                    />
                  ))}
                </div>
                <p className="mt-1 text-xs text-slate-500">Up to 4 highlights shown on the card. At least one is required.</p>
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
                    icon={<CurrencyRupee fontSize="small" />}
                    onChange={(e) => setPriceRupees(e.target.value)}
                    error={priceInvalid}
                    placeholder="0 for free"
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    {priceInvalid ? "Enter a valid amount between ₹0 and ₹1,00,000." : `Stored as ${pricePaise?.toLocaleString("en-IN")} paise.`}
                  </p>
                </div>
                <div>
                  <label htmlFor="c-thumb" className="mb-1 block text-sm font-semibold text-ink-700">
                    Thumbnail <span className="text-danger">*</span>
                  </label>
                  <div className="mt-1 space-y-3">
                    <MediaReference
                      url={thumbnailUrl}
                      onPick={() => setPicking(true)}
                      onClear={() => setThumbnailUrl("")}
                      alt="Course thumbnail"
                    />
                    <details className="group">
                      <summary className="cursor-pointer text-xs font-semibold text-brand-700 hover:underline">
                        or paste an image URL
                      </summary>
                      <Input
                        id="c-thumb"
                        type="url"
                        value={thumbnailUrl}
                        icon={<Image fontSize="small" />}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        error={urlInvalid}
                        placeholder="https://…"
                        className="mt-2"
                      />
                    </details>
                    {urlInvalid && <p className="text-xs text-danger">Enter a valid image URL.</p>}
                    {!urlInvalid && thumbMissing && <p className="text-xs text-danger">A thumbnail is required.</p>}
                  </div>
                  <MediaPicker
                    open={picking}
                    selected={[]}
                    onClose={() => setPicking(false)}
                    onConfirm={(assets) => {
                      const picked = assets[0];
                      if (picked) setThumbnailUrl(picked.url);
                      setPicking(false);
                    }}
                  />
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
          <Panel title="Preview">
            <p className="text-sm text-slate-500">
              Current price: <strong className="text-ink-900">{priceInvalid ? "—" : formatMoney(pricePaise ?? 0, initial.currency)}</strong>
            </p>
            {thumbnailUrl && (
              <div className="mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbnailUrl} alt="" className="aspect-[16/10] w-full rounded-xl object-cover" />
              </div>
            )}
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

function withDraftTag(tags: string[], draft: string): string[] {
  const t = draft.trim();
  if (!t || tags.some((x) => x.toLowerCase() === t.toLowerCase())) return tags;
  return [...tags, t.slice(0, 30)];
}

function normalizeFeatures(f?: string[] | null): string[] {
  const a = f ?? [];
  return [a[0] ?? "", a[1] ?? "", a[2] ?? "", a[3] ?? ""];
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