"use client";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { AdminApplicationRow, AdminStats } from "@/lib/app-types";
import { formatDate, formatMoney } from "@/lib/format";
import { buttonClass } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { AdminHeader, MetricCard, Panel, Skeleton, StatusPill, statusTone, useAsync, userName } from "./admin-ui";

const PENDING = ["SUBMITTED", "UNDER_REVIEW", "INTERVIEW_SCHEDULED"];

export default function AdminDashboard({ firstName }: { firstName?: string }) {
  const stats = useAsync(() => apiGet<AdminStats>("/admin/stats"), []);
  const apps = useAsync(
    () => apiGet<{ applications: AdminApplicationRow[]; total: number }>("/applications", { status: "SUBMITTED", limit: 5 }),
    [],
  );
  const pendingApps = stats.data
    ? PENDING.reduce((sum, k) => sum + (stats.data!.applications[k] ?? 0), 0)
    : null;

  return (
    <div className="space-y-8">
      <AdminHeader
        title="Admin overview"
        description={`Signed in as ${firstName ?? "admin"}. Operational health across users, courses, enrolments and payments.`}
        actions={
          <>
            <Link href="/dashboard/admin/courses/new" className={buttonClass("primary", "sm")}>
              New course
            </Link>
            <Link href="/dashboard/admin/users" className={buttonClass("secondary", "sm")}>
              Manage users
            </Link>
          </>
        }
      />

      {stats.error ? (
        <ErrorState message={stats.error} onRetry={stats.reload} />
      ) : stats.loading || !stats.data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[110px] rounded-[20px]" />
          ))}
        </div>
      ) : (
        <StatsGrid s={stats.data} pendingApps={pendingApps ?? 0} />
      )}

      <Panel
        title="Mentor applications awaiting review"
        description="Submitted and in-review applications that need an admin decision."
        actions={
          <span className="text-sm font-semibold text-slate-500">
            {apps.loading ? "…" : `${apps.data?.total ?? 0} total`}
          </span>
        }
      >
        {apps.error ? (
          <ErrorState message={apps.error} onRetry={apps.reload} />
        ) : apps.loading && !apps.data ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : apps.data && apps.data.applications.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {apps.data.applications.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-ink-900">{userName(a.user)}</p>
                  <p className="truncate text-sm text-slate-500">
                    {a.course.title} · applied {formatDate(a.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusPill tone={statusTone(a.status)}>{a.status.replace(/_/g, " ").toLowerCase()}</StatusPill>
                  <Link
                    href={`/dashboard/admin/courses/${a.course.id}`}
                    className="text-sm font-semibold text-brand-700 hover:underline"
                  >
                    Open course
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No pending applications" description="New mentor applications will appear here for review." />
        )}
      </Panel>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink href="/dashboard/admin/analytics" title="Analytics" body="Registrations, enrolments and revenue over time." />
        <QuickLink href="/dashboard/admin/users" title="User management" body="Search accounts, invite admins, edit roles." />
        <QuickLink href="/dashboard/admin/courses" title="Course management" body="Draft, publish and maintain the catalogue." />
      </div>
    </div>
  );
}

function StatsGrid({ s, pendingApps }: { s: AdminStats; pendingApps: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <MetricCard label="Users" value={s.users} hint={`+${s.newUsers} in last 7 days`} href="/dashboard/admin/users" />
      <MetricCard label="Active learners" value={s.activeLearners} hint="Active learner enrolments" />
      <MetricCard label="Active mentors" value={s.mentors} hint="Active mentor assignments" />
      <MetricCard label="Enrolments" value={s.enrollments} hint="All learner enrolments" />
      <MetricCard
        label="Revenue (paid)"
        value={formatMoney(s.revenuePaise)}
        hint={`${s.paidOrders} paid orders`}
      />
      <MetricCard
        label="Courses"
        value={s.courses.total}
        hint={`${s.courses.published} published · ${s.courses.draft} draft · ${s.courses.archived} archived`}
        href="/dashboard/admin/courses"
      />
      <MetricCard
        label="Pending applications"
        value={pendingApps}
        tone={pendingApps > 0 ? "warn" : "default"}
        hint="Awaiting review"
      />
      <MetricCard
        label="Payments"
        value={s.payments.ok}
        hint={`${s.payments.failed} failed payment${s.payments.failed === 1 ? "" : "s"}`}
      />
    </div>
  );
}

function QuickLink({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-elev1 transition hover:border-brand-300"
    >
      <p className="font-display font-bold text-ink-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{body}</p>
    </Link>
  );
}
