"use client";

import { useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { OrganizationRow, OrganizationType } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import { notifySuccess, notifyError } from "@/lib/notify";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { AdminHeader, ConfirmDialog, FilterSelect, Panel, Skeleton, StatusPill, useAsync } from "./admin-ui";
import { CmsDialog, Field, MediaPicker, MediaReference, cmsError } from "./cms-ui";

const TYPES: OrganizationType[] = ["SCHOOL", "PARTNER", "FRANCHISE", "NGO", "OTHER"];

const TYPE_LABEL: Record<OrganizationType, string> = {
  SCHOOL: "School",
  PARTNER: "Partner",
  FRANCHISE: "Franchise",
  NGO: "NGO",
  OTHER: "Other",
};

const TYPE_FILTER = [{ value: "", label: "All types" }, ...TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t] }))];

export default function CmsOrganizations() {
  const items = useAsync(() => apiGet<{ items: OrganizationRow[] }>("/cms/admin/organizations"), []);
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const [editing, setEditing] = useState<OrganizationRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<OrganizationRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const query = q.trim().toLowerCase();
  const list = (items.data?.items ?? []).filter(
    (o) => (!type || o.type === type) && (!query || `${o.name} ${o.summary ?? ""}`.toLowerCase().includes(query)),
  );

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await apiDelete(`/cms/admin/organizations/${deleting.id}`);
      notifySuccess("Organization deleted");
      setDeleting(null);
      items.reload();
    } catch (e) {
      notifyError(cmsError(e, "Could not delete the organization"));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Partners & Organizations"
        description="Schools, partners, and collaborators. Published records appear on the public Partners page."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            New organization
          </Button>
        }
      />

      <Panel
        title="Organizations"
        description="Search and type filter apply to the loaded list; the server returns all organizations sorted by name."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect id="org-type" label="Type" value={type} onChange={setType} options={TYPE_FILTER} />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              aria-label="Search organizations"
              className="w-48 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
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
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2 font-semibold">Name</th>
                  <th className="px-2 py-2 font-semibold">Type</th>
                  <th className="px-2 py-2 font-semibold">Website</th>
                  <th className="px-2 py-2 font-semibold">Linked</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                  <th className="px-2 py-2 font-semibold">Updated</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((o) => (
                  <tr key={o.id} className="align-top">
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        {o.logoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={o.logoUrl} alt="" loading="lazy" className="h-8 w-8 rounded object-contain" />
                        ) : (
                          <span aria-hidden className="grid h-8 w-8 place-items-center rounded bg-slate-100 text-xs font-semibold text-slate-500">
                            {o.name.slice(0, 1).toUpperCase()}
                          </span>
                        )}
                        <span className="font-semibold text-ink-900">{o.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3"><StatusPill tone="neutral">{TYPE_LABEL[o.type]}</StatusPill></td>
                    <td className="px-2 py-3 text-slate-600">
                      {o.websiteUrl ? (
                        <a href={o.websiteUrl} target="_blank" rel="noopener noreferrer" className="break-all text-brand-700 hover:underline">
                          {host(o.websiteUrl)}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-2 py-3 text-slate-600">
                      {o._count ? `${o._count.members} members · ${o._count.workItems} work · ${o._count.programs} programs` : "—"}
                    </td>
                    <td className="px-2 py-3">
                      <StatusPill tone={o.isPublished ? "success" : "warn"}>{o.isPublished ? "published" : "draft"}</StatusPill>
                    </td>
                    <td className="px-2 py-3 text-slate-600">{formatDate(o.updatedAt)}</td>
                    <td className="px-2 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditing(o)}>Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => setDeleting(o)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={query || type ? "No organizations match" : "No organizations yet"}
            description="Add partners and schools to list them on the public Partners page."
            action={<Button size="sm" onClick={() => setCreating(true)}>New organization</Button>}
          />
        )}
      </Panel>

      <p className="text-sm text-slate-500">
        Organizations are sorted by name server-side; there is no manual ordering endpoint. Deleting an organization
        detaches its work items and programs (they are kept, with the organization cleared).
      </p>

      {(creating || editing) && (
        <OrgEditor
          item={editing}
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
        title="Delete organization"
        confirmLabel="Delete"
        tone="danger"
        busy={deleteBusy}
        onClose={() => !deleteBusy && setDeleting(null)}
        onConfirm={confirmDelete}
      >
        <p>
          Delete <strong>{deleting?.name}</strong>? This cannot be undone. Linked work items and programs remain but lose
          their organization link.
        </p>
      </ConfirmDialog>
    </div>
  );
}

function OrgEditor({ item, onClose, onSaved }: { item: OrganizationRow | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = item !== null;
  const [name, setName] = useState(item?.name ?? "");
  const [type, setType] = useState<OrganizationType>(item?.type ?? "PARTNER");
  const [summary, setSummary] = useState(item?.summary ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [logoUrl, setLogoUrl] = useState(item?.logoUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(item?.websiteUrl ?? "");
  const [contactEmail, setContactEmail] = useState(item?.contactEmail ?? "");
  const [isPublished, setIsPublished] = useState(item?.isPublished ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);

  const nameInvalid = name.trim().length < 2 || name.trim().length > 160;
  const summaryInvalid = summary.trim().length > 600;
  const logoInvalid = logoUrl.trim().length > 0 && !isUrl(logoUrl.trim());
  const siteInvalid = websiteUrl.trim().length > 0 && !isUrl(websiteUrl.trim());
  const emailInvalid = contactEmail.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim());
  const formValid = !nameInvalid && !summaryInvalid && !logoInvalid && !siteInvalid && !emailInvalid;

  const dirty =
    name !== (item?.name ?? "") ||
    type !== (item?.type ?? "PARTNER") ||
    summary !== (item?.summary ?? "") ||
    description !== (item?.description ?? "") ||
    logoUrl !== (item?.logoUrl ?? "") ||
    websiteUrl !== (item?.websiteUrl ?? "") ||
    contactEmail !== (item?.contactEmail ?? "") ||
    isPublished !== (item?.isPublished ?? false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !formValid) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: name.trim(),
      type,
      summary: summary.trim() || null,
      description: description.trim() || null,
      logoUrl: logoUrl.trim() || null,
      websiteUrl: websiteUrl.trim() || null,
      contactEmail: contactEmail.trim() || null,
      isPublished,
    };
    try {
      if (isEdit) await apiPatch(`/cms/admin/organizations/${item!.id}`, payload);
      else await apiPost("/cms/admin/organizations", payload);
      notifySuccess(isEdit ? "Organization saved" : "Organization created");
      onSaved();
    } catch (err) {
      setError(cmsError(err, "Could not save the organization."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <CmsDialog
      open
      title={isEdit ? "Edit organization" : "New organization"}
      description={isEdit ? `Slug: ${item!.slug}` : "A URL slug is generated from the name on save."}
      busy={saving}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="secondary" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button size="sm" type="submit" form="org-form" loading={saving} disabled={!formValid || (isEdit && !dirty)}>
            {isEdit ? "Save changes" : "Create"}
          </Button>
        </>
      }
    >
      <form id="org-form" onSubmit={submit} noValidate className="space-y-4">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="o-name" required>
            <Input id="o-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={160} error={name.length > 0 && nameInvalid} />
          </Field>
          <Field label="Type" htmlFor="o-type" required>
            <select
              id="o-type"
              value={type}
              onChange={(e) => setType(e.target.value as OrganizationType)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>{TYPE_LABEL[t]}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Summary" htmlFor="o-summary" hint="Up to 600 characters.">
          <textarea
            id="o-summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            maxLength={600}
            rows={2}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
        </Field>
        <Field label="Description" htmlFor="o-desc" hint="Up to 10,000 characters. Internal detail; not shown publicly.">
          <textarea
            id="o-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={10_000}
            rows={4}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
        </Field>
        <Field label="Logo" hint="Choose a URL-registered asset from the Media Library.">
          <MediaReference url={logoUrl} alt={name} onPick={() => setPicker(true)} onClear={() => setLogoUrl("")} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Website URL" htmlFor="o-site" hint="Public — shown on the Partners page.">
            <Input id="o-site" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} error={websiteUrl.length > 0 && siteInvalid} placeholder="https://…" />
          </Field>
          <Field label="Contact email" htmlFor="o-email" hint="Internal only; never shown publicly.">
            <Input id="o-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} error={contactEmail.length > 0 && emailInvalid} />
          </Field>
        </div>
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
          if (assets[0]) setLogoUrl(assets[0].url);
          setPicker(false);
        }}
      />
    </CmsDialog>
  );
}

function host(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function isUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}
