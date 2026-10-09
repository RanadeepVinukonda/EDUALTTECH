"use client";

import { useState } from "react";
import Link from "next/link";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import type { AdminCourseSummary, AdminMentorRow, AdminUserRow } from "@/lib/app-types";
import { notifySuccess, notifyError } from "@/lib/notify";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Button from "@/components/ui/Button";
import { AdminHeader, ConfirmDialog, Panel, Skeleton, StatusPill, statusTone, useAsync, useDebouncedValue, userName } from "./admin-ui";

export default function AdminMentors() {
  const mentors = useAsync(() => apiGet<{ mentors: AdminMentorRow[] }>("/admin/mentors"), []);
  const [q, setQ] = useState("");
  const [assigning, setAssigning] = useState(false);
  const query = q.trim().toLowerCase();

  const list = (mentors.data?.mentors ?? []).filter(
    (m) => !query || `${m.user.firstName} ${m.user.lastName} ${m.user.email} ${m.course.title}`.toLowerCase().includes(query),
  );

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Mentor management"
        description="Approved course-specific mentor assignments. MENTOR is a per-course role, never a global account role."
        actions={
          <Button size="sm" onClick={() => setAssigning(true)}>
            Assign mentor
          </Button>
        }
      />

      <Panel
        title="Assignments"
        description="Server returns all mentor assignments. Capacity is enforced during learner seat selection, not by this screen."
        actions={
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search mentor or course…"
            aria-label="Search assignments"
            className="w-56 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        }
      >
        {mentors.error ? (
          <ErrorState message={mentors.error} onRetry={mentors.reload} />
        ) : mentors.loading && !mentors.data ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : list.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2 font-semibold">Mentor</th>
                  <th className="px-2 py-2 font-semibold">Course</th>
                  <th className="px-2 py-2 font-semibold">Capacity</th>
                  <th className="px-2 py-2 font-semibold">Assigned learners</th>
                  <th className="px-2 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((m) => (
                  <tr key={m.id}>
                    <td className="px-2 py-3">
                      <p className="font-semibold text-ink-900">{userName(m.user)}</p>
                      <p className="text-xs text-slate-500">{m.user.email}</p>
                    </td>
                    <td className="px-2 py-3">
                      <Link href={`/dashboard/admin/courses/${m.course.id}`} className="font-medium text-brand-700 hover:underline">
                        {m.course.title}
                      </Link>
                    </td>
                    <td className="px-2 py-3 text-slate-600">{m.capacity ?? "platform default"}</td>
                    <td className="px-2 py-3 text-slate-600">{m.assignedLearners}</td>
                    <td className="px-2 py-3">
                      <StatusPill tone={statusTone(m.status)}>{m.status.toLowerCase()}</StatusPill>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No mentor assignments" description={query ? "No assignments match your search." : "Assign a mentor to a course to get started."} />
        )}
      </Panel>

      <p className="text-sm text-slate-500">
        The backend exposes direct assignment but no endpoint to change capacity or remove an assignment, so neither is
        offered here.
      </p>

      {assigning && <AssignDialog onClose={() => setAssigning(false)} onDone={() => { setAssigning(false); mentors.reload(); }} />}
    </div>
  );
}

function AssignDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const courses = useAsync(() => apiGet<{ courses: AdminCourseSummary[] }>("/admin/courses", { limit: 100 }), []);
  const [courseId, setCourseId] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const debouncedUser = useDebouncedValue(userQuery);
  const users = useAsync(
    () => (debouncedUser.trim().length >= 2 ? apiGet<{ users: AdminUserRow[] }>("/admin/users", { q: debouncedUser, limit: 10 }) : Promise.resolve({ users: [] })),
    [debouncedUser],
  );
  const [user, setUser] = useState<AdminUserRow | null>(null);
  const [capacity, setCapacity] = useState("");
  const [busy, setBusy] = useState(false);

  const capNum = capacity.trim() === "" ? null : Number(capacity);
  const capInvalid = capNum !== null && (!Number.isInteger(capNum) || capNum < 1 || capNum > 1000);

  async function submit() {
    if (!courseId || !user || capInvalid) return;
    setBusy(true);
    try {
      await apiPost(`/admin/courses/${courseId}/mentors`, { userId: user.id, capacity: capNum });
      notifySuccess("Mentor assigned");
      onDone();
    } catch (e) {
      notifyError(e instanceof ApiError ? e.message : "Could not assign mentor");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ConfirmDialog
      open
      title="Assign a mentor"
      confirmLabel="Assign"
      busy={busy}
      onClose={onClose}
      onConfirm={submit}
    >
      <p>
        Creates an ACTIVE MENTOR participation in the chosen course. The backend rejects users who already participate
        in that course (<span className="font-mono text-xs">ALREADY_PARTICIPANT</span>).
      </p>

      <div className="mt-4 space-y-4">
        <div>
          <label htmlFor="a-course" className="block text-sm font-semibold text-ink-900">Course</label>
          <select
            id="a-course"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="">Select a course…</option>
            {(courses.data?.courses ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} ({c.status.toLowerCase()})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="a-user" className="block text-sm font-semibold text-ink-900">Mentor</label>
          {user ? (
            <div className="mt-1 flex items-center justify-between rounded-xl border border-slate-300 px-3 py-2 text-sm">
              <span>{userName(user)} · {user.email}</span>
              <button type="button" onClick={() => setUser(null)} className="text-xs font-semibold text-brand-700 hover:underline">Change</button>
            </div>
          ) : (
            <>
              <input
                id="a-user"
                type="search"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search by name or email…"
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
              {users.data && users.data.users.length > 0 && (
                <ul className="mt-1 max-h-40 overflow-y-auto rounded-xl border border-slate-200">
                  {users.data.users.map((u) => (
                    <li key={u.id}>
                      <button type="button" onClick={() => setUser(u)} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50">
                        {userName(u)} · <span className="text-slate-500">{u.email}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {debouncedUser.trim().length >= 2 && users.data?.users.length === 0 && !users.loading && (
                <p className="mt-1 text-xs text-slate-500">No users found.</p>
              )}
            </>
          )}
        </div>

        <div>
          <label htmlFor="a-cap" className="block text-sm font-semibold text-ink-900">Capacity (optional)</label>
          <input
            id="a-cap"
            type="number"
            min={1}
            max={1000}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Leave blank for the platform default"
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          {capInvalid && <p className="mt-1 text-xs text-red-700">Capacity must be a whole number between 1 and 1000.</p>}
        </div>
      </div>
    </ConfirmDialog>
  );
}
