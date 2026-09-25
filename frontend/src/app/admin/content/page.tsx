"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

type Kind = "work" | "programs" | "organizations" | "media";

interface Row {
  id: string;
  slug?: string;
  title?: string;
  name?: string;
  summary?: string;
  isPublished?: boolean;
  pricePaise?: number | null;
  category?: string;
  url?: string;
  alt?: string;
}

const LABELS: Record<Kind, string> = {
  work: "Work items",
  programs: "Programs",
  organizations: "Organizations",
  media: "Media",
};

interface Draft {
  slug?: string;
  title?: string;
  summary?: string;
  category?: string;
  coverUrl?: string;
  pricePaise?: string;
  name?: string;
  type?: string;
  description?: string;
  contactEmail?: string;
  websiteUrl?: string;
  logoUrl?: string;
  url?: string;
  alt?: string;
  kind?: string;
  organizationId?: string;
  isPublished?: boolean;
}

export default function AdminContentPage() {
  const [kind, setKind] = useState<Kind>("work");
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ items: Row[] }>(`/cms/admin/${kind}`)
      .then((d) => setRows(d.items))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, [kind]);

  useEffect(load, [load]);

  const form = (() => {
    if (kind === "work") return { slug: "", title: "", summary: "", category: "Digital Solution", coverUrl: "", isPublished: true };
    if (kind === "programs") return { slug: "", title: "", summary: "", pricePaise: "", coverUrl: "", isPublished: true };
    if (kind === "organizations") return { slug: "", name: "", type: "SCHOOL", summary: "", description: "", contactEmail: "", websiteUrl: "", logoUrl: "", isPublished: true };
    return { url: "", alt: "", kind: "image" };
  })();
  const [draft, setDraft] = useState<Draft>(form as Draft);
  const [orgs, setOrgs] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => setDraft(form), [kind]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (kind === "work" || kind === "programs") {
      api<{ items: Array<{ id: string; name: string }> }>("/cms/admin/organizations")
        .then((d) => setOrgs(d.items))
        .catch(() => setOrgs([]));
    }
  }, [kind]);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const body: Record<string, unknown> = { ...(draft as unknown as Record<string, unknown>) };
      if (kind === "programs" && draft.pricePaise) body.pricePaise = Math.round(parseFloat(draft.pricePaise) * 100);
      await api(`/cms/admin/${kind}`, { method: "POST", body: JSON.stringify(body) });
      setMessage("Created.");
      setDraft(form);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create");
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (row: Row) => {
    if (row.isPublished === undefined) return;
    try {
      await api(`/cms/admin/${kind}/${row.id}`, {
        method: "PATCH",
        body: JSON.stringify({ isPublished: !row.isPublished }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update");
    }
  };

  const remove = async (row: Row) => {
    if (!confirm(`Delete "${row.title || row.name || row.alt || row.slug}"?`)) return;
    try {
      await api(`/cms/admin/${kind}/${row.id}`, { method: "DELETE" });
      setMessage("Deleted.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete");
    }
  };

  const input = (key: string, label: string, required = false) => (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
      {label}
      <input
        value={String((draft as unknown as Record<string, string>)[key] ?? "")}
        required={required}
        onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
      />
    </label>
  );

  const orgSelect = () => (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
      Organization (links to its school page)
      <select
        value={String((draft as unknown as Record<string, string>).organizationId ?? "")}
        onChange={(e) => setDraft({ ...draft, organizationId: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none"
      >
        <option value="">None</option>
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
      </select>
    </label>
  );

  const upload = (key: string, label: string) => (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
      {label}
      <input
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setMessage(null);
          setError(null);
          try {
            const url = await api<{ url: string }>("/cms/admin/upload", {
              method: "POST",
              headers: { "Content-Type": file.type, "x-cms-file": file.name },
              body: file,
            }).then((d) => d.url);
            setDraft({ ...draft, [key]: url });
            setMessage(`Uploaded — URL filled in for ${label}.`);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Upload failed");
          } finally {
            setBusy(false);
          }
        }}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
      />
      <span className="text-[10px] text-slate-400">PNG / JPEG / WebP / GIF / AVIF, max 25MB.</span>
    </label>
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-2xl font-bold text-slate-900">Content manager</h1>
      <p className="mt-1 text-sm text-slate-500">Work, programs, organizations and media shown on the public site.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {(Object.keys(LABELS) as Kind[]).map((k) => (
          <button
            key={k}
            onClick={() => setKind(k)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              kind === k ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {LABELS[k]}
          </button>
        ))}
      </div>

      <form onSubmit={create} className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-2 lg:grid-cols-3">
        {kind === "work" && (
          <>
            {input("title", "Title", true)}
            {input("slug", "Slug", true)}
            {input("summary", "Summary", true)}
            {input("category", "Category")}
            {upload("coverUrl", "Cover image")}
            {orgSelect()}
          </>
        )}
        {kind === "programs" && (
          <>
            {input("title", "Title", true)}
            {input("slug", "Slug", true)}
            {input("summary", "Summary", true)}
            {input("pricePaise", "Price (₹)")}
            {upload("coverUrl", "Cover image")}
            {orgSelect()}
          </>
        )}
        {kind === "organizations" && (
          <>
            {input("name", "Name", true)}
            {input("slug", "Slug", true)}
            {input("type", "Type (SCHOOL/PARTNER/FRANCHISE/NGO/OTHER)")}
            {input("summary", "Summary")}
            {input("description", "Description")}
            {input("contactEmail", "Contact email")}
            {input("websiteUrl", "Website URL")}
            {upload("logoUrl", "Logo image")}
          </>
        )}
        {kind === "media" && (
          <>
            {upload("url", "Image/Video file")}
            {input("alt", "Alt text")}
            {input("kind", "Kind (image/video/logo/screenshot)")}
          </>
        )}
        <div className="flex items-end">
          <button disabled={busy} className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {busy ? "Saving…" : "Create"}
          </button>
        </div>
      </form>

      {message && <p className="mt-3 text-sm font-medium text-green-600">{message}</p>}
      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Published</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-slate-400">Nothing here yet.</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{r.title || r.name || r.alt || "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{r.slug || r.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    {r.isPublished !== undefined && (
                      <button
                        onClick={() => toggle(r)}
                        className={`rounded-full px-3 py-1 text-xs font-bold ${r.isPublished ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}
                      >
                        {r.isPublished ? "Live" : "Draft"}
                      </button>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(r)} className="text-sm font-semibold text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}