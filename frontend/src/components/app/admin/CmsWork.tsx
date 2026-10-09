"use client";

import { useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { OrganizationRow, WorkItemRow } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import { notifySuccess, notifyError } from "@/lib/notify";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { AdminHeader, ConfirmDialog, Panel, Skeleton, StatusPill, useAsync } from "./admin-ui";
import { CmsDialog, Field, MediaPicker, MediaReference, cmsError } from "./cms-ui";

export default function CmsWork() {
  const items = useAsync(() => apiGet<{ items: WorkItemRow[] }>("/cms/admin/work"), []);
  const orgs = useAsync(() => apiGet<{ items: OrganizationRow[] }>("/cms/admin/organizations"), []);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<WorkItemRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<WorkItemRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const query = q.trim().toLowerCase();
  const list = (items.data?.items ?? []).filter(
    (w) => !query || `${w.title} ${w.summary} ${w.category}`.toLowerCase().includes(query),
  );

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await apiDelete(`/cms/admin/work/${deleting.id}`);
      notifySuccess("Work item deleted");
      setDeleting(null);
      items.reload();
    } catch (e) {
      notifyError(cmsError(e, "Could not delete the work item"));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Work & Projects"
        description="Portfolio entries. Published items appear on the public Our Work page; drafts are never exposed publicly."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            New work item
          </Button>
        }
      />

      <Panel
        title="Entries"
        description="The server returns every entry. Search filters this list; ordering is by publication date."
        actions={
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search work…"
            aria-label="Search work items"
            className="w-56 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        }
      >
        {items.error ? (
          <ErrorState message={items.error} onRetry={items.reload} />
        ) : items.loading && !items.data ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : list.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2 font-semibold">Title</th>
                  <th className="px-2 py-2 font-semibold">Category</th>
                  <th className="px-2 py-2 font-semibold">Organization</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  <th className="px-2 py-2 font-semibold">Updated</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((w) => (
                  <tr key={w.id} className="align-top">
                    <td className="px-2 py-3">
                      <p className="font-semibold text-ink-900">{w.title}</p>
                      <p className="line-clamp-1 text-xs text-slate-500">{w.summary}</p>
                    </td>
                    <td className="px-2 py-3 text-slate-600">{w.category}</td>
                    <td className="px-2 py-3 text-slate-600">{w.organization?.name ?? "—"}</td>
                    <td className="px-2 py-3">
                      <StatusPill tone={w.isPublished ? "success" : "warn"}>{w.isPublished ? "published" : "draft"}</StatusPill>
                    </td>
                    <td className="px-2 py-3 text-slate-600">{formatDate(w.updatedAt)}</td>
                    <td className="px-2 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditing(w)}>Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(w)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={query ? "No work matches your search" : "No work items yet"}
            description="Create an entry to publish it on the public Our Work page."
            action={<Button size="sm" onClick={() => setCreating(true)}>New work item</Button>}
          />
        )}
      </Panel>

      <p className="text-sm text-slate-500">
        Ordering is fixed by the backend (publication date, then creation date). There is no manual reorder or drag-and-drop
        endpoint, and organisations are the only related record the backend tracks.
      </p>

      {(creating || editing) && (
        <WorkEditor
          item={editing}
          organizations={orgs.data?.items ?? []}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            items.reload();
          }}
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        title="Delete work item"
        confirmLabel="Delete"
        tone="danger"
        busy={deleteBusy}
        onClose={() => !deleteBusy && setDeleting(null)}
        onConfirm={confirmDelete}
      >
        <p>
          Permanently delete <strong>{deleting?.title}</strong>? This cannot be undone. It will be removed from the public
          Our Work page immediately.
        </p>
      </ConfirmDialog>
    </div>
  );
}

function WorkEditor({
  item,
  organizations,
  onClose,
  onSaved,
}: {
  item: WorkItemRow | null;
  organizations: OrganizationRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = item !== null;
  const [title, setTitle] = useState(item?.title ?? "");
  const [summary, setSummary] = useState(item?.summary ?? "");
  const [body, setBody] = useState(item?.body ?? "");
  const [category, setCategory] = useState(item?.category ?? "Digital Solution");
  const [coverUrl, setCoverUrl] = useState(item?.coverUrl ?? "");
  const [mediaIds, setMediaIds] = useState<string[]>(item?.mediaIds ?? []);
  const [organizationId, setOrganizationId] = useState(item?.organizationId ?? "");
  const [isPublished, setIsPublished] = useState(item?.isPublished ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState<null | "cover" | "media">(null);

  const titleInvalid = title.trim().length < 2 || title.trim().length > 160;
  const summaryInvalid = summary.trim().length < 2 || summary.trim().length > 600;
  const coverInvalid = coverUrl.trim().length > 0 && !isUrl(coverUrl.trim());
  const formValid = !titleInvalid && !summaryInvalid && !coverInvalid;

  const dirty =
    title !== (item?.title ?? "") ||
    summary !== (item?.summary ?? "") ||
    body !== (item?.body ?? "") ||
    category !== (item?.category ?? "Digital Solution") ||
    coverUrl !== (item?.coverUrl ?? "") ||
    organizationId !== (item?.organizationId ?? "") ||
    isPublished !== (item?.isPublished ?? false) ||
    JSON.stringify(mediaIds) !== JSON.stringify(item?.mediaIds ?? []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !formValid) return;
    setSaving(true);
    setError(null);
    const payload = {
      title: title.trim(),
      summary: summary.trim(),
      body: body.trim() || null,
      category: category.trim() || "Digital Solution",
      coverUrl: coverUrl.trim() || null,
      mediaIds,
      organizationId: organizationId || null,
      isPublished,
    };
    try {
      if (isEdit) {
        await apiPatch(`/cms/admin/work/${item!.id}`, payload);
      } else {
        await apiPost("/cms/admin/work", payload);
      }
      notifySuccess(isEdit ? "Work item saved" : "Work item created");
      onSaved();
    } catch (err) {
      setError(cmsError(err, "Could not save the work item."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <CmsDialog
      open
      title={isEdit ? "Edit work item" : "New work item"}
      description={isEdit ? `Slug: ${item!.slug}` : "A URL slug is generated from the title on save."}
      busy={saving}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="secondary" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button size="sm" type="submit" form="work-form" loading={saving} disabled={!formValid || (isEdit && !dirty)}>
            {isEdit ? "Save changes" : "Create"}
          </Button>
        </>
      }
    >
      <form id="work-form" onSubmit={submit} noValidate className="space-y-4">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Field label="Title" htmlFor="w-title" required>
          <Input id="w-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} error={title.length > 0 && titleInvalid} />
        </Field>
        <Field label="Summary" htmlFor="w-summary" required hint="2–600 characters. Shown in listings.">
          <textarea
            id="w-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={600}
            rows={2}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
        </Field>
        <Field label="Body" htmlFor="w-body" hint="Optional. Up to 20,000 characters.">
          <textarea
            id="w-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={20_000}
            rows={5}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category" htmlFor="w-category">
            <Input id="w-category" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={80} />
          </Field>
          <Field label="Organization" htmlFor="w-org">
            <select
              id="w-org"
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            >
              <option value="">No organization</option>
              {organizations.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Cover image" hint="Choose a URL-registered asset from the Media Library.">
          <MediaReference url={coverUrl} alt={title} onPick={() => setPicker("cover")} onClear={() => setCoverUrl("")} />
        </Field>
        <Field label="Gallery media" hint={`${mediaIds.length} asset${mediaIds.length === 1 ? "" : "s"} selected · up to 30`}>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={() => setPicker("media")}>Select media</Button>
            {mediaIds.length > 0 && (
              <Button type="button" size="sm" variant="ghost" onClick={() => setMediaIds([])}>Clear</Button>
            )}
          </div>
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          Published (visible on the public site)
        </label>
      </form>

      <MediaPicker
        open={picker !== null}
        multiple={picker === "media"}
        selected={picker === "cover" ? [] : mediaIds}
        onClose={() => setPicker(null)}
        onConfirm={(assets) => {
          if (picker === "cover") {
            if (assets[0]) setCoverUrl(assets[0].url);
          } else {
            setMediaIds(assets.map((a) => a.id));
          }
          setPicker(null);
        }}
      />
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
