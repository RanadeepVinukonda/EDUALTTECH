"use client";

import { useState } from "react";
import { apiGet } from "@/lib/api";
import type { AuditLogRow } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { AdminHeader, Pagination, Panel, Skeleton, useAsync, useDebouncedValue } from "./admin-ui";

export default function AdminAudit() {
  const [action, setAction] = useState("");
  const debounced = useDebouncedValue(action);
  const [page, setPage] = useState(1);
  const logs = useAsync(
    () => apiGet<{ logs: AuditLogRow[]; total: number; page: number; limit: number; hasMore: boolean }>("/admin/audit", { action: debounced || undefined, page, limit: 50 }),
    [debounced, page],
  );
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Audit log"
        description="Read-only record of important administrative actions. Events are append-only; no endpoint edits or deletes them."
      />

      <Panel
        title="Events"
        description="Filter matches the action name. There is no outcome, resource-type, or date-range filter in the API."
        actions={
          <input
            type="search"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by action…"
            aria-label="Filter by action"
            className="w-56 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
        }
      >
        {logs.error ? (
          <ErrorState message={logs.error} onRetry={logs.reload} />
        ) : logs.loading && !logs.data ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : logs.data && logs.data.logs.length > 0 ? (
          <div className="space-y-4">
            <ul className="divide-y divide-slate-100">
              {logs.data.logs.map((l) => {
                const open = openId === l.id;
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : l.id)}
                      aria-expanded={open}
                      className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 py-3 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
                    >
                      <span className="font-mono text-xs font-semibold text-brand-800">{l.action}</span>
                      <span className="text-sm text-ink-900">{l.actor ? `${l.actor.firstName} ${l.actor.lastName}`.trim() : "system / removed user"}</span>
                      <span className="text-xs text-slate-500">
                        {l.targetType}
                        {l.targetId ? ` · ${l.targetId.slice(0, 10)}` : ""}
                      </span>
                      <span className="ml-auto text-xs text-slate-500">{formatDate(l.createdAt)}</span>
                    </button>
                    {open && (
                      <div className="mb-2 rounded-xl bg-slate-50 p-3 text-xs">
                        <p className="text-slate-500">Event id: <span className="font-mono text-ink-900">{l.id}</span></p>
                        {l.actorId && <p className="text-slate-500">Actor id: <span className="font-mono text-ink-900">{l.actorId}</span></p>}
                        <p className="text-slate-500">Target: <span className="font-mono text-ink-900">{l.targetType}{l.targetId ? ` / ${l.targetId}` : ""}</span></p>
                        <p className="mt-2 font-semibold text-slate-500">Metadata</p>
                        <pre className={cn("mt-1 overflow-x-auto whitespace-pre-wrap break-words text-ink-900")}>
                          {l.meta == null ? "—" : JSON.stringify(l.meta, null, 2)}
                        </pre>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            <Pagination
              page={logs.data.page}
              total={logs.data.total}
              limit={logs.data.limit}
              hasMore={logs.data.hasMore}
              onChange={setPage}
              busy={logs.loading}
            />
          </div>
        ) : (
          <EmptyState title="No audit events" description="No events match the current filter." />
        )}
      </Panel>
    </div>
  );
}
