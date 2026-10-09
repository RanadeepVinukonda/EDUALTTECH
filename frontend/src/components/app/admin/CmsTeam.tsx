"use client";

import { useState } from "react";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type { TeamMemberRow } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import { notifySuccess, notifyError } from "@/lib/notify";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { AdminHeader, ConfirmDialog, Panel, Skeleton, StatusPill, useAsync } from "./admin-ui";
import { CmsDialog, Field, MediaPicker, MediaReference, cmsError } from "./cms-ui";

export default function CmsTeam() {
  const items = useAsync(() => apiGet<{ items: TeamMemberRow[] }>("/cms/admin/team"), []);
  const [editing, setEditing] = useState<TeamMemberRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<TeamMemberRow | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [orderBusy, setOrderBusy] = useState(false);

  const list = items.data?.items ?? [];

  async function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= list.length) return;
    const a = list[index];
    const b = list[j];
    setOrderBusy(true);
    try {
      await apiPatch(`/cms/admin/team/${a.id}`, { order: j });
      await apiPatch(`/cms/admin/team/${b.id}`, { order: index });
      items.reload();
    } catch (e) {
      notifyError(cmsError(e, "Could not reorder the team"));
      items.reload();
    } finally {
      setOrderBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await apiDelete(`/cms/admin/team/${deleting.id}`);
      notifySuccess("Team member deleted");
      setDeleting(null);
      items.reload();
    } catch (e) {
      notifyError(cmsError(e, "Could not delete the team member"));
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Team"
        description="Public team members. Order controls the display sequence on the public Team page."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            New member
          </Button>
        }
      />

      <Panel title="Members" description="Ordered by display position. Use the arrows to reorder.">
        {items.error ? (
          <ErrorState message={items.error} onRetry={items.reload} />
        ) : items.loading && !items.data ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : list.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {list.map((m, i) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="flex flex-col">
                  <button
                    type="button"
                    aria-label={`Move ${m.name} up`}
                    disabled={i === 0 || orderBusy}
                    onClick={() => move(i, -1)}
                    className="rounded px-1 text-slate-500 hover:text-brand-700 disabled:opacity-30"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${m.name} down`}
                    disabled={i === list.length - 1 || orderBusy}
                    onClick={() => move(i, 1)}
                    className="rounded px-1 text-slate-500 hover:text-brand-700 disabled:opacity-30"
                  >
                    ▼
                  </button>
                </div>
                {m.avatarUrl ? (
                  <img src={m.avatarUrl} alt="" loading="lazy" className="h-11 w-11 rounded-full object-cover" />
                ) : (
                  <span aria-hidden className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
                    {m.name.slice(0, 1).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900">{m.name}</p>
                  <p className="truncate text-sm text-slate-500">{m.title}</p>
                </div>
                <StatusPill tone={m.isPublished ? "success" : "warn"}>{m.isPublished ? "published" : "draft"}</StatusPill>
                <span className="hidden text-xs text-slate-400 sm:block">Updated {formatDate(m.updatedAt)}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(m)}>Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleting(m)}>Delete</Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="No team members yet"
            description="Add people to feature them on the public Team page."
            action={<Button size="sm" onClick={() => setCreating(true)}>New member</Button>}
          />
        )}
      </Panel>

      <p className="text-sm text-slate-500">
        Reordering patches the two swapped positions. If the backend has no public order field beyond this sequence, keep
        them contiguous; there is no drag-and-drop endpoint.
      </p>

      {(creating || editing) && (
        <TeamEditor
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
        title="Delete team member"
        confirmLabel="Delete"
        tone="danger"
        busy={deleteBusy}
        onClose={() => !deleteBusy && setDeleting(null)}
        onConfirm={confirmDelete}
      >
        <p>
          Permanently delete <strong>{deleting?.name}</strong>? This cannot be undone.
        </p>
      </ConfirmDialog>
    </div>
  );
}

function TeamEditor({ item, onClose, onSaved }: { item: TeamMemberRow | null; onClose: () => void; onSaved: () => void }) {
  const isEdit = item !== null;
  const [name, setName] = useState(item?.name ?? "");
  const [title, setTitle] = useState(item?.title ?? "");
  const [bio, setBio] = useState(item?.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState(item?.avatarUrl ?? "");
  const [isPublished, setIsPublished] = useState(item?.isPublished ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picker, setPicker] = useState(false);

  const nameInvalid = name.trim().length < 2 || name.trim().length > 120;
  const titleInvalid = title.trim().length < 2 || title.trim().length > 120;
  const avatarInvalid = avatarUrl.trim().length > 0 && !isUrl(avatarUrl.trim());
  const formValid = !nameInvalid && !titleInvalid && !avatarInvalid;

  const dirty =
    name !== (item?.name ?? "") ||
    title !== (item?.title ?? "") ||
    bio !== (item?.bio ?? "") ||
    avatarUrl !== (item?.avatarUrl ?? "") ||
    isPublished !== (item?.isPublished ?? false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !formValid) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: name.trim(),
      title: title.trim(),
      bio: bio.trim() || null,
      avatarUrl: avatarUrl.trim() || null,
      isPublished,
    };
    try {
      if (isEdit) await apiPatch(`/cms/admin/team/${item!.id}`, payload);
      else await apiPost("/cms/admin/team", payload);
      notifySuccess(isEdit ? "Team member saved" : "Team member added");
      onSaved();
    } catch (err) {
      setError(cmsError(err, "Could not save the team member."));
    } finally {
      setSaving(false);
    }
  }

  return (
    <CmsDialog
      open
      title={isEdit ? "Edit team member" : "New team member"}
      description={isEdit ? undefined : "New members are appended to the end of the display order."}
      busy={saving}
      onClose={onClose}
      footer={
        <>
          <Button size="sm" variant="secondary" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button size="sm" type="submit" form="team-form" loading={saving} disabled={!formValid || (isEdit && !dirty)}>
            {isEdit ? "Save changes" : "Add"}
          </Button>
        </>
      }
    >
      <form id="team-form" onSubmit={submit} noValidate className="space-y-4">
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="t-name" required>
            <Input id="t-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} error={name.length > 0 && nameInvalid} />
          </Field>
          <Field label="Title / role" htmlFor="t-title" required>
            <Input id="t-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} error={title.length > 0 && titleInvalid} />
          </Field>
        </div>
        <Field label="Bio" htmlFor="t-bio" hint="Optional. Up to 2,000 characters.">
          <textarea
            id="t-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={2000}
            rows={3}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
        </Field>
        <Field label="Avatar" hint="Choose a URL-registered asset from the Media Library.">
          <MediaReference url={avatarUrl} alt={name} onPick={() => setPicker(true)} onClear={() => setAvatarUrl("")} />
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
          if (assets[0]) setAvatarUrl(assets[0].url);
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
