"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

type Tab = "logos" | "photos";

interface MediaRow {
  id: string;
  alt: string | null;
  url: string;
  kind: string;
  category: string | null;
  position: string | null;
  width: number | null;
  height: number | null;
}

const LOGO_CATEGORIES = ["SCHOOL", "FRANCHISE", "NGO", "OTHER"] as const;
const PHOTO_CATEGORIES = ["SCHOOLS", "DIGITAL", "MARKETING"] as const;

// Homepage photo slots the admin can fill — mirrors HomeLanding.
const POSITIONS = [
  { value: "hero-1", label: "Hero — left image" },
  { value: "hero-2", label: "Hero — right image" },
  { value: "proof-feature", label: "Proof section — feature card" },
  { value: "proof-1", label: "Proof section — row 1" },
  { value: "proof-2", label: "Proof section — row 2" },
] as const;

const FALLBACKS = {
  "hero-1": "/static/EAT3.jpg",
  "hero-2": "/static/EAT4.jpg",
  "proof-feature": "/static/EAT4.jpg",
  "proof-1": "/static/EAT2.jpg",
  "proof-2": "/static/EAT3.jpg",
} as const;

export default function AdminContentPage() {
  const [tab, setTab] = useState<Tab>("logos");
  const [rows, setRows] = useState<MediaRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [draft, setDraft] = useState({ alt: "", category: LOGO_CATEGORIES[0] as string, position: "", url: "", width: "", height: "" });
  const [uploading, setUploading] = useState(false);
  const [editDim, setEditDim] = useState<Record<string, { width: string; height: string }>>({});
  const [savingDim, setSavingDim] = useState<string | null>(null);

  const kind = tab === "logos" ? "logo" : "image";

  // Live preview data — mirrors HomeLanding. Saves/resizes re-render these instantly.
  const previewLogos = rows.filter((m) => m.kind === "logo");
  const logoStyle = (logo: MediaRow): React.CSSProperties => {
    const style: React.CSSProperties = {};
    if (logo.height && logo.height > 0) style.height = `${logo.height}px`;
    if (logo.width && logo.width > 0) style.width = `${logo.width}px`;
    return style;
  };
  const photosFor = (slot: string) => rows.find((m) => m.kind === "image" && m.position === slot);

  const load = useCallback(() => {
    api<{ items: MediaRow[] }>("/cms/admin/media")
      .then((d) => setRows(d.items.filter((m) => m.kind === kind)))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, [kind]);

  useEffect(load, [load]);

  useEffect(() => {
    setDraft({ alt: "", category: tab === "logos" ? LOGO_CATEGORIES[0] : PHOTO_CATEGORIES[0], position: "", url: "", width: "", height: "" });
  }, [tab]);

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await api<{ url: string }>("/cms/admin/upload", {
        method: "POST",
        headers: { "Content-Type": file.type, "x-cms-file": file.name, "x-cms-folder": tab === "logos" ? "school_logos" : "site_photos" },
        body: file,
      }).then((d) => d.url);
      setDraft((d) => ({ ...d, url }));
      setMessage("Uploaded — press Save to add it.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      await api("/cms/admin/media", {
        method: "POST",
        body: JSON.stringify({
          url: draft.url,
          alt: draft.alt || (tab === "logos" ? draft.category : POSITIONS.find((p) => p.value === draft.position)?.label),
          kind,
          category: draft.category,
          ...(tab === "photos" && draft.position ? { position: draft.position } : {}),
          ...(tab === "logos" && draft.width ? { width: Number(draft.width) } : {}),
          ...(tab === "logos" && draft.height ? { height: Number(draft.height) } : {}),
        }),
      });
      setMessage("Saved.");
      setDraft({ alt: "", category: tab === "logos" ? LOGO_CATEGORIES[0] : PHOTO_CATEGORIES[0], position: "", url: "", width: "", height: "" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const saveDims = async (row: MediaRow) => {
    const d = editDim[row.id];
    if (!d) return;
    setSavingDim(row.id);
    try {
      const data: { width?: number; height?: number } = {};
      if (d.width !== "") data.width = Number(d.width);
      if (d.height !== "") data.height = Number(d.height);
      await api(`/cms/admin/media/${row.id}`, { method: "PATCH", body: JSON.stringify(data) });
      setMessage("Size updated — refresh the preview.");
      setEditDim((m) => { const n = { ...m }; delete n[row.id]; return n; });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update size");
    } finally {
      setSavingDim(null);
    }
  };

  const remove = async (row: MediaRow) => {
    if (!confirm(`Delete this ${kind}?`)) return;
    try {
      await api(`/cms/admin/media/${row.id}`, { method: "DELETE" });
      setMessage("Deleted.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-slate-900">Media manager</h1>
      <p className="mt-1 text-sm text-slate-500">
        Upload school / franchise logos for the homepage scroller, and photos to fill website sections.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["logos", "photos"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              tab === t ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t === "logos" ? "Logos (school / franchise)" : "Photos (website sections)"}
          </button>
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <form onSubmit={save} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            {tab === "logos" ? "Name (school / franchise)" : "Caption"}
            <input
              value={draft.alt}
              onChange={(e) => setDraft((d) => ({ ...d, alt: e.target.value }))}
              placeholder={tab === "logos" ? "e.g. Genesis Public School" : "e.g. Classroom session"}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Category
            <select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
            >
              {(tab === "logos" ? LOGO_CATEGORIES : PHOTO_CATEGORIES).map((c) => (
                <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </label>
          {tab === "photos" && (
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
              Where on the site?
              <select
                value={draft.position}
                onChange={(e) => setDraft((d) => ({ ...d, position: e.target.value }))}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
              >
                <option value="">Unplaced</option>
                {POSITIONS.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </label>
          )}
          {tab === "logos" && (
            <>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Display width (px, optional)
                <input
                  type="number"
                  min={0}
                  value={draft.width}
                  onChange={(e) => setDraft((d) => ({ ...d, width: e.target.value }))}
                  placeholder="e.g. 160"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
                Display height (px, optional)
                <input
                  type="number"
                  min={0}
                  value={draft.height}
                  onChange={(e) => setDraft((d) => ({ ...d, height: e.target.value }))}
                  placeholder="e.g. 60"
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
                />
              </label>
            </>
          )}
          <label className={`flex flex-col gap-1 text-xs font-medium text-slate-600 ${tab === "logos" ? "" : "lg:col-span-1"}`}>
            {tab === "logos" ? "Logo image" : "Photo"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              onChange={onFile}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
            />
          </label>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            {draft.url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={draft.url} alt="preview" className="h-16 w-16 rounded-lg border border-slate-200 object-cover" />
            )}
            <button
              disabled={busy || uploading || !draft.url}
              className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {uploading ? "Uploading…" : busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </section>

      {message && <p className="mt-3 text-sm font-medium text-green-600">{message}</p>}
      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 sm:col-span-2 lg:col-span-3">
            Nothing here yet — upload and save your first {tab === "logos" ? "logo" : "photo"}.
          </p>
        ) : (
          rows.map((r) => (
            <article key={r.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={r.url}
                alt={r.alt ?? ""}
                style={r.width || r.height ? { width: r.width ?? undefined, height: r.height ?? undefined } : undefined}
                className="max-h-16 max-w-16 shrink-0 rounded-lg border border-slate-100 object-contain"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{r.alt ?? "Untitled"}</p>
                <p className="text-xs text-slate-500">
                  {r.category ?? "—"}
                  {r.position ? ` · ${POSITIONS.find((p) => p.value === r.position)?.label ?? r.position}` : ""}
                  {r.kind === "logo" && (r.width ?? r.height) ? ` · ${r.width ?? "auto"}×${r.height ?? "auto"}px` : ""}
                </p>
                {tab === "logos" && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      placeholder="W"
                      value={editDim[r.id]?.width ?? r.width ?? ""}
                      onChange={(e) => setEditDim((m) => ({ ...m, [r.id]: { ...(m[r.id] ?? { width: String(r.width ?? ""), height: String(r.height ?? "") }), width: e.target.value } }))}
                      className="w-16 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">×</span>
                    <input
                      type="number"
                      min={0}
                      placeholder="H"
                      value={editDim[r.id]?.height ?? r.height ?? ""}
                      onChange={(e) => setEditDim((m) => ({ ...m, [r.id]: { ...(m[r.id] ?? { width: String(r.width ?? ""), height: String(r.height ?? "") }), height: e.target.value } }))}
                      className="w-16 rounded-md border border-slate-300 px-2 py-1 text-xs text-slate-900 focus:border-brand-500 focus:outline-none"
                    />
                    <button
                      onClick={() => saveDims(r)}
                      disabled={savingDim === r.id || !editDim[r.id]}
                      className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 disabled:opacity-50"
                    >
                      {savingDim === r.id ? "Saving…" : "Save"}
                    </button>
                  </div>
                )}
              </div>
              <button onClick={() => remove(r)} className="shrink-0 text-sm font-semibold text-red-600 hover:underline">
                Delete
              </button>
            </article>
          ))
        )}
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg font-bold text-slate-900">Site preview</h2>
        <p className="mt-1 text-xs text-slate-500">
          Live view — saves and size edits apply instantly.
        </p>
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-6 w-full text-center text-xs font-bold uppercase tracking-widest text-brand-600">
            Trusted by schools across India
          </div>
          <div className="overflow-hidden">
            <div className="marquee-track flex w-max">
              {[0, 1].map((copy) => (
                <div key={copy} aria-hidden={copy === 1} className="flex min-w-full items-center justify-around gap-x-10 px-10">
                  {previewLogos.map((logo) => (
                    <div key={logo.id} className="flex shrink-0 items-center justify-center" style={logoStyle(logo)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={logo.url} alt={logo.alt ?? ""} className="max-h-24 w-auto object-contain mix-blend-multiply" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {["hero-1", "hero-2", "proof-feature", "proof-1", "proof-2"].map((slot) => {
            const photo = photosFor(slot);
            return (
              <div key={slot} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo?.url ?? FALLBACKS[slot as keyof typeof FALLBACKS]}
                  alt={photo?.alt ?? slot}
                  className="h-20 w-32 shrink-0 rounded-lg border border-slate-100 object-cover"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {POSITIONS.find((p) => p.value === slot)?.label ?? slot}
                  </p>
                  <p className="text-xs text-slate-500">
                    {photo ? `${photo.category ?? "Photo"} · uploaded` : "Fallback image showing"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}