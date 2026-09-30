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
}

const LOGO_CATEGORIES = ["SCHOOL", "FRANCHISE", "NGO", "OTHER"] as const;
const PHOTO_CATEGORIES = ["SCHOOLS", "DIGITAL", "MARKETING"] as const;

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
  const [draft, setDraft] = useState({ alt: "", category: LOGO_CATEGORIES[0] as string, position: "", url: "" });
  const [uploading, setUploading] = useState(false);

  const kind = tab === "logos" ? "logo" : "image";

  const previewLogos = rows.filter((m) => m.kind === "logo");
  const photosFor = (slot: string) => rows.find((m) => m.kind === "image" && m.position === slot);

  const load = useCallback(() => {
    api<{ items: MediaRow[] }>("/cms/admin/media")
      .then((d) => setRows(d.items.filter((m) => m.kind === kind)))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, [kind]);

  useEffect(load, [load]);

  useEffect(() => {
    setDraft({ alt: "", category: tab === "logos" ? LOGO_CATEGORIES[0] : PHOTO_CATEGORIES[0], position: "", url: "" });
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
        }),
      });
      setMessage("Saved.");
      setDraft({ alt: "", category: tab === "logos" ? LOGO_CATEGORIES[0] : PHOTO_CATEGORIES[0], position: "", url: "" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: MediaRow) => {
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
      <h1 className="font-display text-2xl font-bold text-ink-700">Media manager</h1>
      <p className="mt-1 text-sm text-slate-600">
        Upload school / franchise logos for the homepage scroller, and photos to fill website sections.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["logos", "photos"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              tab === t ? "brand-grad text-white shadow-elev1" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {t === "logos" ? "Logo (school / franchise)" : "Photo (website sections)"}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">{message}</p>}

      <section className="mt-6 rounded-[20px] bg-white p-6 shadow-elev2 sm:p-8">
        <h2 className="font-display text-lg font-bold text-ink-700">Add {tab === "logos" ? "a logo" : "a photo"}</h2>
        <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field
            className="sm:col-span-2"
            label={tab === "logos" ? "Name (school / franchise)" : "Caption"}
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          >
            <input
              value={draft.alt}
              onChange={(e) => setDraft((d) => ({ ...d, alt: e.target.value }))}
              placeholder={tab === "logos" ? "e.g. Genesis Public School" : "e.g. Classroom session"}
              className="h-full w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </Field>

          <Field
            label="Category"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          >
            <select
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              className="h-full w-full bg-transparent text-sm text-slate-800 outline-none"
            >
              {(tab === "logos" ? LOGO_CATEGORIES : PHOTO_CATEGORIES).map((c) => (
                <option key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</option>
              ))}
            </select>
          </Field>

          <Field
            label="Where on the site?"
            icon={
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            }
          >
            <select
              value={draft.position}
              onChange={(e) => setDraft((d) => ({ ...d, position: e.target.value }))}
              disabled={tab === "logos"}
              className="h-full w-full bg-transparent text-sm text-slate-800 outline-none disabled:text-slate-400"
            >
              <option value="">Unplaced</option>
              {POSITIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </Field>

          <label className="group flex min-h-[96px] cursor-pointer items-center gap-4 rounded-[10px] border-[1.5px] border-dashed border-slate-300 p-4 transition hover:border-brand-400 hover:bg-brand-50/30 sm:col-span-2">
            {draft.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.url} alt="preview" className="h-16 w-24 shrink-0 rounded-[8px] object-contain bg-slate-50" />
            ) : (
              <span className="flex h-16 w-24 shrink-0 items-center justify-center rounded-[8px] bg-slate-100 text-slate-400 group-hover:bg-brand-100/60 group-hover:text-brand-600">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            )}
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-700">
                {uploading ? "Uploading…" : draft.url ? "Uploaded — click to change" : tab === "logos" ? "Upload logo" : "Upload photo"}
              </span>
              <span className="block text-xs text-slate-400">PNG / JPG / WEBP / GIF, click to pick</span>
            </span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={onFile} className="hidden" />
          </label>

          <div className="flex justify-end sm:col-span-2">
            <button
              type="submit"
              disabled={busy || uploading || !draft.url}
              className="inline-flex h-[50px] items-center gap-2 rounded-[10px] brand-grad px-8 text-[15px] font-medium text-white shadow-elev1 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 21v-8H7v8M7 3v5h8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {uploading ? "Uploading…" : busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </section>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          Nothing here yet — upload and save your first {tab === "logos" ? "logo" : "photo"}.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <article key={r.id} className="flex flex-col rounded-[16px] bg-white p-4 shadow-elev2">
              <div className="flex h-32 items-center justify-center overflow-hidden rounded-[10px] bg-slate-50 p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.url}
                  alt={r.alt ?? ""}
                  className={`${tab === "photos" ? "h-full w-full object-cover" : "max-h-full max-w-full object-contain"}`}
                />
              </div>
              <p className="mt-3 truncate text-sm font-semibold text-slate-900">{r.alt ?? "Untitled"}</p>
              <p className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                <span className="rounded-full bg-brand-50 px-2 py-0.5 font-semibold text-brand-700">{r.category ?? "—"}</span>
                {r.position && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold text-slate-600">
                    {POSITIONS.find((p) => p.value === r.position)?.label ?? r.position}
                  </span>
                )}
              </p>
              <div className="mt-3 flex justify-end border-t border-slate-100 pt-3">
                <button type="button" onClick={() => remove(r)} title="Delete" aria-label="Delete" className="btn-trash">
                  <svg viewBox="0 0 448 512" className="svgIcon" aria-hidden="true">
                    <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
                  </svg>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-[20px] bg-white p-6 shadow-elev2 sm:p-8">
        <h2 className="font-display text-lg font-bold text-ink-700">Site preview</h2>
        <p className="mt-1 text-xs text-slate-500">Live view — saves apply instantly.</p>

        <div className="mb-6 mt-4 w-full text-center text-xs font-bold uppercase tracking-widest text-brand-600">
          Trusted by schools across India
        </div>
        <div className="overflow-hidden">
          <div className="marquee-track flex w-max">
            {[0, 1].map((copy) => (
              <div key={copy} aria-hidden={copy === 1} className="flex min-w-full items-center justify-around gap-x-10 px-10">
                {previewLogos.map((logo) => (
                  <div key={logo.id} className="flex shrink-0 items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={logo.url} alt={logo.alt ?? ""} className="max-h-24 w-auto object-contain mix-blend-multiply" />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {["hero-1", "hero-2", "proof-feature", "proof-1", "proof-2"].map((slot) => {
            const photo = photosFor(slot);
            return (
              <div key={slot} className="flex items-center gap-4 rounded-[16px] border border-slate-100 bg-slate-50/50 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo?.url ?? FALLBACKS[slot as keyof typeof FALLBACKS]}
                  alt={photo?.alt ?? slot}
                  className="h-20 w-32 shrink-0 rounded-lg border border-slate-100 object-cover"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
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

function Field({
  label,
  icon,
  children,
  className = "",
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`${className}`}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="flex h-[50px] items-center rounded-[10px] border-[1.5px] border-slate-200 px-3 transition focus-within:border-brand-500">
        {icon}
        <span className="ml-2 min-w-0 flex-1">{children}</span>
      </span>
    </label>
  );
}