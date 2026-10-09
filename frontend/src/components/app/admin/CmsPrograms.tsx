"use client";

import { useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { OrganizationRow, ProgramRow } from "@/lib/app-types";
import { formatDate, formatMoney } from "@/lib/format";
import { notifySuccess, notifyError } from "@/lib/notify";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { AdminHeader, ConfirmDialog, Panel, Skeleton, StatusPill, useAsync } from "./admin-ui";
import { CmsDialog, Field, MediaPicker, MediaReference, cmsError } from "./cms-ui";

export default function CmsPrograms() {
  const items = useAsync(() => apiGet<{ items: ProgramRow[] }>("/cms/admin/programs"), []);
  const orgs = useAsync(() => apiGet<{ items: OrganizationRow[] }>("/cms/admin/organizations"), []);
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<ProgramRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<ProgramRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const query = q.trim().toLowerCase();
  const list = (items.data?.items ?? []).filter(
    (p) => !query || `${p.title} ${p.summary}`.toLowerCase().includes(query),
  );

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await apiDelete(`/cms/admin/programs/${deleting.id}`);
      notifySuccess("Program deleted");
      setDeleting(null);
      items.reload();
    } catch (e) {
      notifyError(cmsError(e, "Could not delete the program"));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Programs"
        description="Offering catalogue. Programs are informational records — the backend has no enrolment, dates, or category for them yet."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            New program
          </Button>
        }
      />

      <Panel
        title="Programs"
        description="Sorted newest first. Search filters the loaded list."
        actions={
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search programs…"
            aria-label="Search programs"
            className="w-56 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        }
      >
        {items.error ? (
          <ErrorState message={items.error} onRetry={items.reload} />
        ) : items.loading && !items.data ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : list.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2 font-semibold">Title</th>
                  <th className="px-2 py-2 font-semibold">Organization</th>
                  <th className="px-2 py-2 font-semibold">Price</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  <th className="px-2 py-2 font-semibold">Updated</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((p) => (
                  <tr key={p.id} className="align-top">
                    <td className="px-2 py-3">
                      <p className="font-semibold text-ink-900">{p.title}</p>
                      <p className="line-clamp-1 text-xs text-slate-500">{p.summary}</p>
                    </td>
                    <td className="px-2 py-3 text-slate-600">{p.organization?.name ?? "—"}</td>
                    <td className="px-2 py-3 text-slate-600">{p.pricePaise == null ? "—" : formatMoney(p.pricePaise)}</td>
                    <td className="px-2 py-3">
                      <StatusPill tone={p.isPublished ? "success" : "warn"}>{p.isPublished ? "published" : "draft"}</StatusPill>
                    </td>
                    <td className="px-2 py-3 text-slate-600">{formatDate(p.updatedAt)}</td>
                    <td className="px-2 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditing(p)}>Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(p)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={query ? "No programs match your search" : "No programs yet"}
            description="Add a program to list it on the public site."
            action={<Button size="sm" onClick={() => setCreating(true)}>New program</Button>}
          />
        )}
      </Panel>

      <p className="text-sm text-slate-500">
        The backend model has no start/end dates, no category, and no enrolment or checkout flow for programs — only a
        price and an optional organisation.
      </p>

      {(creating || editing) && (
        <ProgramEditor
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
        title="Delete program"
        confirmLabel="Delete"
        tone="danger"
        busy={deleteBusy}
        onClose={() => !deleteBusy && setDeleting(null)}
        onConfirm={confirmDelete}
      >
        <p>
          Permanently delete <strong>{deleting?.title}</strong>? This cannot be undone.
        </p>
      </ConfirmDialog>
    </div>
  );
}

function ProgramEditor({
  item,
  organizations,
  onClose,
  onSaved,
}: {
  item: ProgramRow | null;
  organizations: OrganizationRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = item !== null;
  const [title, setTitle] = useState(item?.title ?? "");
  const [summary, setSummary] = useState(item?.summary ?? "");
  const [body, setBody] = useState(item?.body ?? "");
  const [price, setPrice] = useState(item?.pricePaise != null ? String(item.pricePaise / 100) : "");
  const [coverUrl, setCoverUrl] = useState(item?.coverUrl ?? "");
  const [organizationId, setOrganizationId] = useState(item?.organizationId ?? "");
  const [isPublished, setIsPublished] = useState(item?.isPublished ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);

  const titleInvalid = title.trim().length < 2 || title.trim().length > 160;
  const summaryInvalid = summary.trim().length < 2 || summary.trim().length > 600;
  const priceInvalid = price.trim().length > 0 && (!/^\d+(\.\d{1,2})?$/.test(price.trim()) || Number(price) > 100_000);
  const coverInvalid = coverUrl.trim().length > 0 && !isUrl(coverUrl.trim());
  const formValid = !titleInvalid && !summaryInvalid && !priceInvalid && !coverInvalid;

  const initialPrice = item?.pricePaise != null ? String(item.pricePaise / 100) : "";
  const dirty =
    title !== (item?.title ?? "") ||
    summary !== (item?.summary ?? "") ||
    body !== (item?.body ?? "") ||
    price !== initialPrice ||
    coverUrl !== (item?.coverUrl ?? "") ||
    organizationId !== (item?.organizationId ?? "") ||
    isPublished !== (item?.isPublished ?? false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !formValid) return;
    setSaving(true);
    setError(null);
    const pricePaise = price.trim() ? Math.round(Number(price.trim()) * 100) : null;
    const payload = {
      title: title.trim(),
      summary: summary.trim(),
      body: body.trim() || null,
      pricePaise,
      coverUrl: coverUrl.trim() || null,
      organizationId: organizationId || null,
      isPublished,
    };
    try {
      if (isEdit) await apiPatch(`/cms/admin/programs/${item!.id}`, payload);
      else await apiPost("/cms/admin/programs", payload);
      notifySuccess(isEdit ? "Program saved" : "Program created");
      onSaved();
    } catch (err) {
      setError(cmsError(err, "Could not save the program."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <CmsDialog
      open
      title={isEdit ? "Edit program" : "New program"}
      description={isEdit ? `Slug: ${item!.slug}` : "A URL slug is generated from the title on save."}
      busy={saving}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="secondary" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button size="sm" type="submit" form="program-form" loading={saving} disabled={!formValid || (isEdit && !dirty)}>
            {isEdit ? "Save changes" : "Create"}
          </Button>
        </>
      }
    >
      <form id="program-form" onSubmit={submit} noValidate className="space-y-4">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <Field label="Title" htmlFor="p-title" required>
          <Input id="p-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} error={title.length > 0 && titleInvalid} />
        </Field>
        <Field label="Summary" htmlFor="p-summary" required hint="2–600 characters. Shown in listings.">
          <textarea
            id="p-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={600}
            rows={2}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
        </Field>
        <Field label="Body" htmlFor="p-body" hint="Optional. Up to 20,000 characters.">
          <textarea
            id="p-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={20_000}
            rows={5}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (₹)" htmlFor="p-price" hint="Leave blank for no price. Up to ₹1,00,000.">
            <Input
              id="p-price"
              type="text"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              error={price.length > 0 && !!priceInvalid}
              placeholder="e.g. 4999"
            />
          </Field>
          <Field label="Organization" htmlFor="p-org">
            <select
              id="p-org"
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
          <MediaReference url={coverUrl} alt={title} onPick={() => setPicker(true)} onClear={() => setCoverUrl("")} />
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold text-ink-700">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="h-4 w-4 rounded border-slate-300" />
          Published (visible on the public site)
        </label>
      </form>

      <MediaPicker
        open={picker}
        selected={[]}
        onClose={() => setPicker(false)}
        onConfirm={(assets) => {
          if (assets[0]) setCoverUrl(assets[0].url);
          setPicker(false);
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
