"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import PasswordInput from "@/components/ui/PasswordInput";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  schoolName: string | null;
  isActive: boolean;
}

export default function AdminUsersPage() {
  const [items, setItems] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "USER" as "USER" | "ADMIN" });
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ items: UserRow[] }>("/admin/users?limit=100")
      .then((d) => setItems(d.items))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  async function toggleActive(u: UserRow) {
    setBusyId(u.id);
    setError(null);
    try {
      await api(`/admin/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !u.isActive }) });
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update the account");
    } finally {
      setBusyId(null);
    }
  }

  async function createUser(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api("/admin/users", { method: "POST", body: JSON.stringify(form) });
      setForm({ name: "", email: "", password: "", role: "USER" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the account");
    } finally {
      setBusy(false);
    }
  }

  async function removeUser(u: UserRow) {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    setDeletingId(u.id);
    setError(null);
    try {
      await api(`/admin/users/${u.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the account");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink-700">Users</h1>
      <p className="mt-1 text-sm text-slate-600">Everyone is a user. A user learns in courses they join and mentors the courses they guide.</p>
      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={createUser} className="mt-6 grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-5">
        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <PasswordInput
          required
          placeholder="Password (8+, letter+number)"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="text-sm"
        />
        <select
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as "USER" | "ADMIN" }))}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        >
          <option value="USER">User</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg brand-grad px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Creating…" : "Create account"}
        </button>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3">Role</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                  Loading accounts…
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-slate-500">
                  No users yet — create one above.
                </td>
              </tr>
            ) : (
              items.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-3 font-medium text-slate-900">{u.name}</td>
                <td className="px-5 py-3 text-slate-600">{u.email}</td>
                <td className="px-5 py-3">{u.role}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.isActive ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"}`}>
                    {u.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => toggleActive(u)}
                      disabled={busyId === u.id}
                      title={u.isActive ? "Disable account" : "Enable account"}
                      aria-label={u.isActive ? "Disable account" : "Enable account"}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border transition disabled:opacity-50 ${
                        u.isActive
                          ? "border-slate-200 bg-white text-slate-400 hover:border-amber-300 hover:text-amber-600"
                          : "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
                      }`}
                    >
                      {busyId === u.id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                      ) : u.isActive ? (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M4.9 4.9l14.2 14.2" />
                        </svg>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                          <path d="M22 4L12 14.01l-3-3" />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => removeUser(u)}
                      disabled={deletingId === u.id}
                      title="Delete account"
                      aria-label="Delete account"
                      className="btn-trash disabled:opacity-40">
                      <svg viewBox="0 0 448 512" className="svgIcon" aria-hidden="true">
                        <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
