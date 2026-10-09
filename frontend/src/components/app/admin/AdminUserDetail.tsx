"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ApiError, apiDelete, apiGet, apiPatch } from "@/lib/api";
import type { AdminUserRow, Role } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import { useAuth } from "@/components/app/AuthProvider";
import { notifySuccess } from "@/lib/notify";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { AdminHeader, Panel, Skeleton, StatusPill, useAsync, userName } from "./admin-ui";

interface UsersResponse {
  users: AdminUserRow[];
  total: number;
}

function detailError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.code === "FORBIDDEN" || err.status === 403) return "Your account doesn’t have permission to do that.";
    if (err.code === "UNAUTHORIZED" || err.status === 401) return "Your session expired. Please sign in again.";
    if (err.code === "LAST_ADMIN") return "At least one active admin must remain.";
    if (err.code === "VALIDATION") return err.message || "Please check the details and try again.";
    if (err.code === "RATE_LIMITED" || err.status === 429) return "Too many requests. Please wait a moment.";
  }
  return err instanceof Error ? err.message : fallback;
}

export default function AdminUserDetail({ id, email }: { id: string; email: string | null }) {
  if (!email) {
    return (
      <EmptyState
        title="Open a user to manage them"
        description="This page identifies a user by email because the backend exposes user lookup through the searchable list, not a by-id endpoint. Open a user from User Management."
        action={
          <Link href="/dashboard/admin/users" className="text-sm font-semibold text-brand-700 hover:underline">
            Go to User Management
          </Link>
        }
      />
    );
  }

  return <UserLoader id={id} email={email} />;
}

function UserLoader({ id, email }: { id: string; email: string }) {
  const { data, error, loading, reload } = useAsync(
    () => apiGet<UsersResponse>("/admin/users", { q: email, limit: 100 }),
    [email],
  );

  const user = useMemo(
    () => data?.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null,
    [data, email],
  );

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-72 rounded-[20px]" />
      </div>
    );
  }
  if (error) return <ErrorState message={detailError(error, "Could not load this user.")} onRetry={reload} />;
  if (!user) {
    return (
      <EmptyState
        title="User not found"
        description="No account matches this email. It may have been removed."
        action={
          <Link href="/dashboard/admin/users" className="text-sm font-semibold text-brand-700 hover:underline">
            Back to User Management
          </Link>
        }
      />
    );
  }
  return <UserEditor key={user.id} user={user} expectedId={id} onSaved={reload} />;
}

function UserEditor({ user, expectedId, onSaved }: { user: AdminUserRow; expectedId: string; onSaved: () => void }) {
  const { user: me } = useAuth();
  const router = useRouter();
  const isSelf = me?.id === user.id;

  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [role, setRole] = useState<Role>(user.role);
  const [isActive, setIsActive] = useState(user.isActive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [confirmRemove, setConfirmRemove] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const dirty =
    firstName !== user.firstName || lastName !== user.lastName || role !== user.role || isActive !== user.isActive;

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !dirty || isSelf) return;
    const patch: Record<string, unknown> = {};
    if (firstName.trim() !== user.firstName) patch.firstName = firstName.trim();
    if (lastName.trim() !== user.lastName) patch.lastName = lastName.trim();
    if (role !== user.role) patch.role = role;
    if (isActive !== user.isActive) patch.isActive = isActive;
    if (Object.keys(patch).length === 0) return;

    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      await apiPatch(`/admin/users/${user.id}`, patch);
      notifySuccess("Changes saved");
      setNotice("Saved.");
      onSaved();
    } catch (err) {
      setError(detailError(err, "Could not save changes."));
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setRole(user.role);
    setIsActive(user.isActive);
    setError(null);
    setNotice(null);
  }

  async function remove() {
    if (removing) return;
    setRemoving(true);
    setRemoveError(null);
    try {
      const res = await apiDelete<{ ok?: boolean; deactivated?: boolean }>(`/admin/users/${user.id}`);
      notifySuccess(res.deactivated ? "Account deactivated" : "Account deleted");
      router.push("/dashboard/admin/users");
    } catch (err) {
      setRemoveError(detailError(err, "Could not remove this account."));
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title={userName(user)}
        description={`${user.email} · joined ${formatDate(user.createdAt, { dateStyle: "medium" })}`}
        actions={
          <Link href="/dashboard/admin/users" className="text-sm font-semibold text-brand-700 hover:underline">
            ← All users
          </Link>
        }
      />

      {expectedId !== user.id && (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          The email lookup matched a different record than the requested id. Verify before editing.
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Account" description="Read-only attributes from the server.">
          <dl className="space-y-3 text-sm">
            <Row label="Email" value={user.email} />
            <Row label="Account role" value={<StatusPill tone={user.role === "ADMIN" ? "info" : "neutral"}>{user.role}</StatusPill>} />
            <Row
              label="Status"
              value={<StatusPill tone={user.isActive ? "success" : "danger"}>{user.isActive ? "Active" : "Inactive"}</StatusPill>}
            />
            <Row label="Mobile" value={user.mobile || "—"} />
            <Row label="Mobile verified" value={user.mobileVerifiedAt ? "Yes" : "No"} />
            <Row label="Email verified" value={user.emailVerifiedAt ? "Yes" : "No"} />
            <Row label="Learner enrolments" value={String(user._count.participations)} />
          </dl>
        </Panel>

        <Panel title="Edit account" description="Only fields the backend accepts are editable.">
          <form onSubmit={save} className="space-y-4" noValidate>
            {isSelf && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                You can’t modify your own role or account here.
              </p>
            )}
            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            {notice && !error && (
              <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {notice}
              </p>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="u-first" className="mb-1 block text-sm font-semibold text-ink-700">First name</label>
                <Input id="u-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={80} disabled={isSelf} required />
              </div>
              <div>
                <label htmlFor="u-last" className="mb-1 block text-sm font-semibold text-ink-700">Last name</label>
                <Input id="u-last" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={80} disabled={isSelf} required />
              </div>
            </div>
            <div>
              <label htmlFor="u-role" className="mb-1 block text-sm font-semibold text-ink-700">Account role</label>
              <select
                id="u-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                disabled={isSelf}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 disabled:bg-slate-50"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">
                MENTOR and LEARNER are course-specific and not editable here.
              </p>
            </div>
            <label className="flex items-center gap-3 text-sm font-semibold text-ink-700">
              <input
                type="checkbox"
                checked={isActive}
                disabled={isSelf}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-600/30"
              />
              Account active
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={reset} disabled={!dirty || saving}>
                Discard
              </Button>
              <Button type="submit" size="sm" loading={saving} disabled={!dirty || isSelf}>
                Save changes
              </Button>
            </div>
          </form>
        </Panel>

        <Panel title="Danger zone" description="Removing an account is destructive.">
          {removeError && (
            <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {removeError}
            </p>
          )}
          <p className="text-sm text-slate-600">
            If the account has orders, courses, applications or other history, it is <strong>deactivated</strong> instead of
            deleted so records are preserved. Accounts with no history are permanently deleted.
          </p>
          {isSelf ? (
            <p className="mt-3 text-sm text-slate-500">You can’t remove your own account.</p>
          ) : confirmRemove ? (
            <div className="mt-3 space-y-2">
              <p className="text-sm font-semibold text-red-700">
                Confirm removal of {userName(user)}? This can’t be undone from here.
              </p>
              <div className="flex gap-2">
                <Button variant="danger" size="sm" loading={removing} onClick={remove}>
                  Yes, remove account
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(false)} disabled={removing}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="danger" size="sm" className="mt-3" onClick={() => setConfirmRemove(true)}>
              Deactivate / remove account
            </Button>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-ink-900">{value}</dd>
    </div>
  );
}
