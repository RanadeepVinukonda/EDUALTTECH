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
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "USER" as "USER" | "ADMIN" });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<{ items: UserRow[] }>("/admin/users?limit=100")
      .then((d) => setItems(d.items))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, []);

  useEffect(load, [load]);

  async function toggleActive(u: UserRow) {
    await api(`/admin/users/${u.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !u.isActive }) });
    load();
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
    setError(null);
    try {
      await api(`/admin/users/${u.id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the account");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Users</h1>
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
            {items.map((u) => (
              <tr key={u.id}>
                <td className="px-5 py-3 font-medium text-slate-900">{u.name}</td>
                <td className="px-5 py-3 text-slate-600">{u.email}</td>
                <td className="px-5 py-3">{u.role}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${u.isActive ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"}`}>
                    {u.isActive ? "Active" : "Disabled"}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button onClick={() => toggleActive(u)} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                    {u.isActive ? "Disable" : "Enable"}
                  </button>
                  <button onClick={() => removeUser(u)} className="ml-4 text-sm font-semibold text-red-600 hover:text-red-700">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
