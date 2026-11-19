"use client";

import Link from "next/link";
import Insights from "@mui/icons-material/Insights";
import MenuBook from "@mui/icons-material/MenuBook";
import PeopleAlt from "@mui/icons-material/PeopleAlt";
import { apiGet } from "@/lib/api";
import type { AdminApplicationRow, AdminStats } from "@/lib/app-types";
import { formatDate, formatMoney } from "@/lib/format";
import { buttonClass } from "@/components/ui/Button";
import EmptyState from "@/components/ui/EmptyState";
import ErrorState from "@/components/ui/ErrorState";
import { useAuth } from "../AuthProvider";
import { AdminHeader, MetricCard, Panel, Skeleton, StatusPill, statusTone, useAsync, userName } from "./admin-ui";

const PENDING = ["SUBMITTED", "UNDER_REVIEW", "INTERVIEW_SCHEDULED"];

export default function AdminDashboard() {
  const { user } = useAuth();
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
        title={`Welcome back${user?.firstName ? `, ${user.firstName}` : ""}`}
        description={`Platform pulse for ${new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}.`}
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
            <Skeleton key={i} className="h-[110px] rounded-xl" />
          ))}
        </div>
      ) : (
        <StatsGrid s={stats.data} pendingApps={pendingApps ?? 0} />
      )}

      <Panel
        title="Mentor applications awaiting review"
        description="Applications that need your decision."
        actions={
          <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
            {apps.loading ? "…" : `${apps.data?.total ?? 0} pending`}
          </span>
        }
      >
        {apps.error ? (
          <ErrorState message={apps.error} onRetry={apps.reload} />
        ) : apps.loading && !apps.data ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : apps.data && apps.data.applications.length > 0 ? (
          <ul className="-my-2 divide-y divide-slate-100">
            {apps.data.applications.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3.5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700">
                  {(a.user?.firstName?.[0] ?? "").toUpperCase()}
                  {(a.user?.lastName?.[0] ?? "").toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink-900">{userName(a.user)}</p>
                  <p className="truncate text-sm text-slate-500">
                    {a.course.title} · {formatDate(a.createdAt, { dateStyle: "medium" })}
                  </p>
                </div>
                <StatusPill tone={statusTone(a.status)}>{a.status.replace(/_/g, " ").toLowerCase()}</StatusPill>
                <Link
                  href={`/dashboard/admin/applications/${a.id}`}
                  className="text-sm font-semibold text-brand-700 hover:underline"
                >
                  Review
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="No pending applications" description="New mentor applications will appear here for review." />
        )}
      </Panel>

      <Panel title="Workspace" description="Jump to the areas you use most.">
        <div className="grid gap-2 sm:grid-cols-3">
          <WorkspaceLink
            href="/dashboard/admin/analytics"
            title="Analytics"
            body="Trends and revenue"
            icon={<Insights fontSize="small" aria-hidden />}
          />
          <WorkspaceLink
            href="/dashboard/admin/users"
            title="Users"
            body="Accounts and roles"
            icon={<PeopleAlt fontSize="small" aria-hidden />}
          />
          <WorkspaceLink
            href="/dashboard/admin/courses"
            title="Courses"
            body="Draft and publish"
            icon={<MenuBook fontSize="small" aria-hidden />}
          />
        </div>
      </Panel>
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

function WorkspaceLink({
  href,
  title,
  body,
  icon,
}: {
  href: string;
  title: string;
  body: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 transition hover:border-brand-300 hover:bg-brand-50/40"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600 transition group-hover:bg-brand-100 group-hover:text-brand-700">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink-900">{title}</span>
        <span className="block truncate text-xs text-slate-500">{body}</span>
      </span>
      <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-slate-400 transition group-hover:text-brand-600">
        <path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
