"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, getAccessToken } from "@/lib/api";
import { Loader } from "@/components/Loader";
import { useMinLoading } from "@/lib/useMinLoading";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  kind: string;
  thumbnailUrl: string | null;
  fileUrl: string;
  fileSizeBytes: number | null;
  downloads: number;
  ownerId: string | null;
  createdAt: string;
}

const KINDS = ["pdf", "doc", "slides", "video", "audio"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ResourcesPage() {
  const [items, setItems] = useState<Resource[]>([]);
  const [mine, setMine] = useState<{ items: Resource[]; quotaBytes: number; usedBytes: number } | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const showLoader = loading || useMinLoading(!loading);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("General");
  const [kind, setKind] = useState("pdf");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api<{ items: Resource[] }>(`/resources?search=${encodeURIComponent(search)}`)
        .then((d) => setItems(d.items))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadMine = useCallback(() => {
    api<{ items: Resource[]; quotaBytes: number; usedBytes: number }>("/resources/my")
      .then(setMine)
      .catch(() => undefined);
  }, []);

  useEffect(loadMine, []);

  function cacheBust() {
    api<{ items: Resource[] }>("/resources?search=").then((d) => setItems(d.items));
  }

  async function handleUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const token = getAccessToken();
    if (!token) {
      setUploadError("Sign in to upload files.");
      return;
    }

    setUploading(true);
    setUploadError(null);
    try {
      // ponytail: raw put; the API helper forces JSON, so this goes direct,
      // accepting a re-login if the token happens to rotate mid-upload.
      const res = await fetch(`/backend/resources/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/octet-stream",
          "x-resource-title": title.trim(),
          "x-resource-subject": subject.trim(),
          "x-resource-kind": kind,
          "x-resource-file": file.name,
          "x-resource-mime": file.type || "application/octet-stream",
        },
        body: file,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Upload failed");
      }
      setTitle("");
      setFileName("");
      input.value = "";
      loadMine();
      cacheBust();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this file? Learners will lose access.")) return;
    await api<{ deleted: boolean }>(`/resources/${id}`, { method: "DELETE" });
    loadMine();
    cacheBust();
  }

  async function download(id: string) {
    const { fileUrl } = await api<{ fileUrl: string }>(`/resources/${id}/download`, { method: "POST" });
    window.open(fileUrl, "_blank");
  }

  const usedPct = mine && mine.quotaBytes > 0 ? Math.min(100, (mine.usedBytes / mine.quotaBytes) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-slate-900">Resources library</h1>
      <p className="mt-1 text-slate-600">Browse study materials, or upload your own for the whole school.</p>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Upload a file</h2>
        <form onSubmit={handleUpload} className="mt-3 flex flex-wrap items-end gap-3">
          <label className="flex flex-col text-xs text-slate-500">
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
              placeholder="e.g. Intro to Python — Notes"
              className="mt-1 w-56 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </label>
          <label className="flex flex-col text-xs text-slate-500">
            Subject
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="General"
              className="mt-1 w-40 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </label>
          <label className="flex flex-col text-xs text-slate-500">
            Type
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col text-xs text-slate-500">
            File
            <input
              required
              name="file"
              type="file"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              className="mt-1 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:hover:bg-brand-700"
            />
          </label>
          <button
            type="submit"
            disabled={uploading || !title}
            className="rounded-lg brand-grad px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40"
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </form>
        {fileName && <p className="mt-2 text-xs text-slate-500">{fileName}</p>}
        {uploadError && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{uploadError}</p>}
      </section>

      {mine && mine.items.length > 0 && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-semibold text-slate-900">Your uploads</h2>
            <p className="text-xs text-slate-500">
              {formatBytes(mine.usedBytes)} / {formatBytes(mine.quotaBytes)} used
            </p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full brand-grad" style={{ width: `${usedPct}%` }} />
          </div>
          <ul className="mt-4 divide-y divide-slate-100">
            {mine.items.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="truncate text-slate-700">
                  {r.title} <span className="text-slate-400">· {r.subject} · {formatBytes(r.fileSizeBytes ?? 0)}</span>
                </span>
                <button onClick={() => remove(r.id)} className="shrink-0 text-xs font-semibold text-red-600 hover:text-red-700">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search materials…"
        className="mt-6 w-full max-w-md rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
      />

      {showLoader ? (
        <Loader />
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((r) => (
            <div key={r.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {r.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.thumbnailUrl} alt="" className="h-32 w-full object-cover" />
              )}
              <div className="flex flex-1 flex-col p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{r.subject} · {r.kind}</p>
              <h2 className="mt-1 font-semibold text-slate-900">{r.title}</h2>
              {r.description && <p className="mt-1 text-sm text-slate-600">{r.description}</p>}
              {r.fileSizeBytes != null && <p className="mt-1 text-xs text-slate-400">{formatBytes(r.fileSizeBytes)}</p>}
              <button
                onClick={() => download(r.id)}
                className="mt-auto pt-4 text-left text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Download ↓ <span className="font-normal text-slate-400">({r.downloads})</span>
              </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}