"use client";

import { useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { MediaAssetRow } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import { notifySuccess, notifyError } from "@/lib/notify";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { AdminHeader, ConfirmDialog, FilterSelect, Panel, Skeleton, useAsync } from "./admin-ui";
import { CmsDialog, Field, cmsError } from "./cms-ui";

const KINDS = ["image", "logo", "icon", "document", "video", "other"];
const KIND_FILTER = [{ value: "", label: "All kinds" }, ...KINDS.map((k) => ({ value: k, label: k }))];

export default function CmsMediaLibrary() {
  const items = useAsync(() => apiGet<{ assets: MediaAssetRow[] }>("/cms/admin/media"), []);
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<MediaAssetRow | null>(null);
  const [deleting, setDeleting] = useState<MediaAssetRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const query = q.trim().toLowerCase();
  const list = (items.data?.assets ?? []).filter(
    (a) =>
      (!kind || a.kind === kind) &&
      (!query || `${a.alt ?? ""} ${a.url} ${a.category ?? ""}`.toLowerCase().includes(query)),
  );

  async function copyUrl(asset: MediaAssetRow) {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopied(asset.id);
      window.setTimeout(() => setCopied((c) => (c === asset.id ? null : c)), 1500);
    } catch {
      notifyError("Could not copy to clipboard");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await apiDelete(`/cms/admin/media/${deleting.id}`);
      notifySuccess("Asset removed");
      setDeleting(null);
      items.reload();
    } catch (e) {
      notifyError(cmsError(e, "Could not remove the asset"));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Media Library"
        description="Register reusable images and files by URL, then reference them from work items, programs, and team profiles."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            Add by URL
          </Button>
        }
      />

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <strong>No direct upload here.</strong> The backend has no file-upload endpoint for the media library — assets are
        registered by pasting a public URL. Avatars are the only file-upload flow (from account settings). Deleting an
        asset removes its record only; the underlying file is not deleted and any referencing page will show a broken image.
      </div>

      <Panel
        title="Assets"
        description="Newest first. Activity filtering and search apply to the loaded list."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect id="media-kind" label="Kind" value={kind} onChange={setKind} options={KIND_FILTER} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              aria-label="Search media"
              className="w-48 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
        }
      >
        {items.error ? (
          <ErrorState message={items.error} onRetry={items.reload} />
        ) : items.loading && !items.data ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] rounded-xl" />
            ))}
          </div>
        ) : list.length > 0 ? (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((a) => (
              <li key={a.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="aspect-[4/3] overflow-hidden bg-slate-100">
                  {a.kind === "image" || a.kind === "logo" || a.kind === "icon" ? (
                    <img src={a.url} alt={a.alt ?? ""} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div className="grid h-full place-items-center text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {a.kind}
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-3">
                  <p className="truncate text-sm font-semibold text-ink-900" title={a.alt ?? undefined}>
                    {a.alt || "Untitled asset"}
                  </p>
                  <p className="truncate text-xs text-slate-500" title={a.url}>{a.url}</p>
                  <p className="text-xs text-slate-400">
                    {a.category ? `${a.category} · ` : ""}{formatDate(a.createdAt)}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="secondary" onClick={() => setEditing(a)}>Edit</Button>
                    <Button size="sm" variant="ghost" onClick={() => copyUrl(a)}>
                      {copied === a.id ? "Copied" : "Copy URL"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(a)}>Delete</Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title={query || kind ? "No assets match" : "No media yet"}
            description="Add an image or file by its public URL to reuse it across the site."
            action={<Button size="sm" onClick={() => setCreating(true)}>Add by URL</Button>}
          />
        )}
      </Panel>

      {creating && (
        <MediaEditor
          item={null}
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false);
            items.reload();
          }}
        />
      )}
      {editing && (
        <MediaEditor
          item={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            items.reload();
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Remove asset"
        confirmLabel="Remove"
        tone="danger"
        busy={deleteBusy}
        onClose={() => !deleteBusy && setDeleting(null)}
        onConfirm={confirmDelete}
      >
        <p>
          Remove <strong>{deleting?.alt || deleting?.url}</strong> from the library? The record is deleted, but the file
          itself is not, and the backend cannot tell you which pages referenced it.
        </p>
      </ConfirmDialog>
    </div>
  );
}

function MediaEditor({ item, onClose, onSaved }: { item: MediaAssetRow | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = item !== null;
  const [url, setUrl] = useState(item?.url ?? "");
  const [kind, setKind] = useState(item?.kind ?? "image");
  const [alt, setAlt] = useState(item?.alt ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [position, setPosition] = useState(item?.position ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlInvalid = !isUrl(url.trim());
  const formValid = !urlInvalid && alt.trim().length <= 300;
  const initial = {
    url: item?.url ?? "",
    kind: item?.kind ?? "image",
    alt: item?.alt ?? "",
    category: item?.category ?? "",
    position: item?.position ?? "",
  };
  const dirty =
    url !== initial.url ||
    kind !== initial.kind ||
    alt !== initial.alt ||
    category !== initial.category ||
    position !== initial.position;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !formValid) return;
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await apiPatch(`/cms/admin/media/${item!.id}`, {
          url: url.trim(),
          alt: alt.trim() || null,
          category: category.trim() || null,
          position: position.trim() || null,
        });
      } else {
        await apiPost("/cms/admin/media", {
          url: url.trim(),
          kind,
          alt: alt.trim() || null,
          category: category.trim() || null,
          position: position.trim() || null,
        });
      }
      notifySuccess(isEdit ? "Asset saved" : "Asset added");
      onSaved();
    } catch (err) {
      setError(cmsError(err, "Could not save the asset."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <CmsDialog
      open
      title={isEdit ? "Edit asset" : "Add asset by URL"}
      description={isEdit ? undefined : "Paste a public image or file URL. Kind cannot be changed after creation."}
      busy={saving}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="secondary" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button size="sm" type="submit" form="media-form" loading={saving} disabled={!formValid || (isEdit && !dirty)}>
            {isEdit ? "Save changes" : "Add asset"}
          </Button>
        </>
      }
    >
      <form id="media-form" onSubmit={submit} noValidate className="space-y-4">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Field label="URL" htmlFor="m-url" required hint="Must be a full http(s) URL. Shown as the asset preview.">
          <Input
            id="m-url"
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            error={url.length > 0 && urlInvalid}
            placeholder="https://…"
          />
        </Field>
        {!isEdit && (
          <Field label="Kind" htmlFor="m-kind" required>
            <select
              id="m-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Alt text" htmlFor="m-alt" hint="Optional. Describe the image for screen readers. Up to 300 characters.">
          <Input id="m-alt" value={alt} onChange={(e) => setAlt(e.target.value)} maxLength={300} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="m-cat" hint="Optional grouping, e.g. hero, team, work.">
            <Input id="m-cat" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={60} />
          </Field>
          <Field label="Position" htmlFor="m-pos" hint="Optional hint, e.g. top, left, banner.">
            <Input id="m-pos" value={position} onChange={(e) => setPosition(e.target.value)} maxLength={60} />
          </Field>
        </div>
        {isUrl(url.trim()) && (kind === "image" || kind === "logo" || kind === "icon") && (
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <img src={url.trim()} alt={alt || "Preview"} className="max-h-48 w-full object-contain bg-slate-50" />
          </div>
        )}
      </form>
    </CmsDialog>
  );
}

function isUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
