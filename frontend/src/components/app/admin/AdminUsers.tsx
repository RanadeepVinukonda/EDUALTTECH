"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError, apiGet } from "@/lib/api";
import type { AdminUserRow, Role } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import Button from "@/components/ui/Button";
import { EyeIcon } from "@/components/ui/IconActionButton";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Search from "@mui/icons-material/Search";
import Badge from "@mui/icons-material/Badge";
import { AdminHeader, Panel, Skeleton, StatusPill, useAsync, useDebouncedValue, userName } from "./admin-ui";
import InviteUserDialog from "./InviteUserDialog";

const LIMIT = 20;

interface UsersResponse {
  users: AdminUserRow[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

function listError(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === "FORBIDDEN" || err.status === 403) return "Your account doesn’t have permission to view users.";
    if (err.code === "UNAUTHORIZED" || err.status === 401) return "Your session expired. Please sign in again.";
    if (err.code === "RATE_LIMITED" || err.status === 429) return "Too many requests. Please wait a moment.";
  }
  return err instanceof Error ? err.message : "Could not load users.";
}

export default function AdminUsers() {
  return (
    <Suspense fallback={null}>
      <AdminUsersView />
    </Suspense>
  );
}

function AdminUsersView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const initialRole = params.get("role");
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [role, setRole] = useState<"" | Role>(initialRole === "ADMIN" || initialRole === "USER" ? initialRole : "");
  const [page, setPage] = useState(Number(params.get("page") ?? "1") || 1);
  const [inviteOpen, setInviteOpen] = useState(false);
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    const next = new URLSearchParams();
    if (debouncedQuery.trim()) next.set("q", debouncedQuery.trim());
    if (role) next.set("role", role);
    if (page > 1) next.set("page", String(page));
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [debouncedQuery, role, page, pathname, router]);

  const { data, error, loading, reload } = useAsync(
    () =>
      apiGet<UsersResponse>("/admin/users", {
        ...(debouncedQuery.trim() ? { q: debouncedQuery.trim() } : {}),
        ...(role ? { role } : {}),
        page,
        limit: LIMIT,
      }),
    [debouncedQuery, role, page],
  );

  const filtersActive = query.trim().length > 0 || role !== "";

  return (
    <div className="space-y-6">
      <AdminHeader
        title="User management"
        description="Global accounts across the platform. MENTOR and LEARNER are course-specific roles, not account roles."
        actions={
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            Invite user
          </Button>
        }
      />

      <Panel>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="user-search" className="mb-1 block text-sm font-semibold text-ink-700">
              Search
            </label>
            <Input
              id="user-search"
              type="search"
              value={query}
              icon={<Search fontSize="small" />}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Name or email…"
            />
          </div>
          <div>
            <label htmlFor="user-role" className="mb-1 block text-sm font-semibold text-ink-700">
              Role
            </label>
            <Select
              id="user-role"
              value={role}
              icon={<Badge fontSize="small" />}
              className="w-auto"
              onChange={(e) => {
                setRole(e.target.value as "" | Role);
                setPage(1);
              }}
            >
              <option value="">All roles</option>
              <option value="USER">USER</option>
              <option value="ADMIN">ADMIN</option>
            </Select>
          </div>
          {filtersActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setRole("");
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </Panel>

      <Panel
        title="Accounts"
        description={
          data
            ? `${data.total} account${data.total === 1 ? "" : "s"}${filtersActive ? " matching filters" : ""}`
            : undefined
        }
        actions={
          data && (
            <span className="text-sm text-slate-500">
              Page {data.page} of {Math.max(1, Math.ceil(data.total / LIMIT))}
            </span>
          )
        }
      >
        {error ? (
          <ErrorState message={listError(error)} onRetry={reload} />
        ) : loading && !data ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : data && data.users.length === 0 ? (
          <EmptyState
            title={filtersActive ? "No matching users" : "No users yet"}
            description={filtersActive ? "Try a different search or clear the filters." : "Invite the first user to get started."}
          />
        ) : data ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th scope="col" className="py-2 pr-4 font-semibold">User</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Role</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Status</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Learner enrolments</th>
                    <th scope="col" className="py-2 pr-4 font-semibold">Joined</th>
                    <th scope="col" className="py-2 font-semibold"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50">
                      <th scope="row" className="py-3 pr-4">
                        <p className="font-semibold text-ink-900">{userName(u)}</p>
                        <p className="text-xs font-normal text-slate-500">{u.email}</p>
                      </th>
                      <td className="py-3 pr-4">
                        <StatusPill tone={u.role === "ADMIN" ? "info" : "neutral"}>{u.role}</StatusPill>
                      </td>
                      <td className="py-3 pr-4">
                        <StatusPill tone={u.isActive ? "success" : "danger"}>{u.isActive ? "Active" : "Inactive"}</StatusPill>
                      </td>
                      <td className="py-3 pr-4 text-slate-600 tabular-nums">{u._count.participations}</td>
                      <td className="py-3 pr-4 text-slate-600">{formatDate(u.createdAt, { dateStyle: "medium" })}</td>
                      <td className="py-3 text-right">
                        <Link
                          href={`/dashboard/admin/users/${u.id}?email=${encodeURIComponent(u.email)}`}
                          className="hv-btn hv-btn--view"
                          aria-label={`View user: ${userName(u)}`}
                        >
                          <EyeIcon />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="divide-y divide-slate-100 md:hidden">
              {data.users.map((u) => (
                <li key={u.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink-900">{userName(u)}</p>
                      <p className="truncate text-xs text-slate-500">{u.email}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusPill tone={u.role === "ADMIN" ? "info" : "neutral"}>{u.role}</StatusPill>
                        <StatusPill tone={u.isActive ? "success" : "danger"}>{u.isActive ? "Active" : "Inactive"}</StatusPill>
                        <span className="text-xs text-slate-500">{u._count.participations} enrolments</span>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/admin/users/${u.id}?email=${encodeURIComponent(u.email)}`}
                      className="hv-btn hv-btn--view"
                      aria-label={`View user: ${userName(u)}`}
                    >
                      <EyeIcon />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center justify-between">
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!data.hasMore || loading}
              >
                Next
              </Button>
            </div>
          </>
        ) : null}
      </Panel>

      <InviteUserDialog open={inviteOpen} onClose={() => setInviteOpen(false)} onCreated={reload} />
    </div>
  );
}
