"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import type { Application, ApplicationStatus } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { AdminHeader, FilterSelect, Pagination, Panel, Skeleton, StatusPill, statusTone, useAsync, userName } from "./admin-ui";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview scheduled" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "REJECTED", label: "Rejected" },
];

export default function AdminApplications() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [page, setPage] = useState(Number(params.get("page") ?? "1") || 1);

  // Keep the URL in sync so returning from a detail view restores filters.
  useEffect(() => {
    const next = new URLSearchParams();
    if (status) next.set("status", status);
    if (page > 1) next.set("page", String(page));
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [status, page, pathname, router]);

  const apps = useAsync(
    () => apiGet<{ applications: Application[]; total: number; page: number; limit: number; hasMore: boolean }>("/applications", { status: status || undefined, page, limit: 20 }),
    [status, page],
  );

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Mentor applications"
        description="Course-specific applications. A pending application never grants teaching access — approval is a backend state transition."
      />

      <Panel
        title="Queue"
        description="Server-filtered by status and paginated. Open an application to review it."
        actions={
          <FilterSelect
            id="app-status"
            label="Status"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
          />
        }
      >
        {apps.error ? (
          <ErrorState message={apps.error} onRetry={apps.reload} />
        ) : apps.loading && !apps.data ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : apps.data && apps.data.applications.length > 0 ? (
          <div className="space-y-4">
            <ul className="divide-y divide-slate-100">
              {apps.data.applications.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/dashboard/admin/applications/${a.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 py-3 no-underline hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
                  >
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink-900">{userName(a.user)}</span>
                      <span className="block truncate text-sm text-slate-500">
                        {a.user?.email ?? "no email"} · {a.course.title}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <StatusPill tone={statusTone(a.status as ApplicationStatus)}>{a.status.replace(/_/g, " ").toLowerCase()}</StatusPill>
                      <span className="text-xs text-slate-500">{formatDate(a.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination
              page={apps.data.page}
              total={apps.data.total}
              limit={apps.data.limit}
              hasMore={apps.data.hasMore}
              onChange={setPage}
              busy={apps.loading}
            />
          </div>
        ) : (
          <EmptyState
            title={status ? "No applications with this status" : "No applications yet"}
            description="Mentor applications submitted for published courses appear here."
          />
        )}
      </Panel>
    </div>
  );
}
