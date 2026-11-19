"use client";

import Link from "next/link";
import Insights from "@mui/icons-material/Insights";
import MenuBook from "@mui/icons-material/MenuBook";
import PeopleAlt from "@mui/icons-material/PeopleAlt";
import School from "@mui/icons-material/School";
import Handshake from "@mui/icons-material/Handshake";
import CurrencyRupee from "@mui/icons-material/CurrencyRupee";
import AssignmentInd from "@mui/icons-material/AssignmentInd";
import Payment from "@mui/icons-material/Payment";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Security from "@mui/icons-material/Security";
import Tune from "@mui/icons-material/Tune";
import HowToVote from "@mui/icons-material/HowToVote";
import AutoStories from "@mui/icons-material/AutoStories";
import Email from "@mui/icons-material/Email";
import Add from "@mui/icons-material/Add";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Refresh from "@mui/icons-material/Refresh";
import Verified from "@mui/icons-material/Verified";

import { apiGet } from "@/lib/api";
import type { AdminApplicationRow, AdminStats } from "@/lib/app-types";
import { formatDate, formatMoney } from "@/lib/format";
import ErrorState from "@/components/ui/ErrorState";
import { useAuth } from "../AuthProvider";
import { MetricCard, Panel, Skeleton, StatusPill, statusTone, useAsync, userName } from "./admin-ui";

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
    <div className="space-y-10">
      {/* Executive Command Banner */}
      <section
        className="relative overflow-hidden rounded-3xl border border-rule bg-paper-2 p-6 shadow-elev1 sm:p-8"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15, 32, 39, 0.05) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-brand-800">
                <span className="h-2 w-2 rounded-full bg-brand-600 animate-pulse" />
                Mission Control · Live Pulse
              </span>
              <span className="rounded-full border border-rule bg-paper px-2.5 py-0.5 text-[11px] font-medium text-muted">
                EduAltTech Core Hub
              </span>
            </div>

            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
            </h1>

            <p className="mt-2 text-sm leading-relaxed text-ink-2 sm:text-base">
              Real-time platform metrics for{" "}
              <strong className="font-semibold text-ink">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </strong>
              . Monitor learner cohorts, mentor pipelines, revenue streams, and course operations.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5 sm:gap-3">
            <Link
              href="/dashboard/admin/courses/new"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#025926] px-5 text-sm font-semibold text-white shadow-elev1 transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <Add sx={{ fontSize: 18 }} aria-hidden />
              New course
            </Link>

            <Link
              href="/dashboard/admin/users"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rule bg-[#ffffff] px-4 text-sm font-semibold text-ink shadow-xs transition hover:bg-paper-2 hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <PeopleAlt sx={{ fontSize: 18 }} aria-hidden className="text-muted" />
              Manage users
            </Link>

            <button
              type="button"
              onClick={() => {
                stats.reload();
                apps.reload();
              }}
              title="Refresh live metrics"
              aria-label="Refresh live metrics"
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-rule bg-[#ffffff] text-ink-2 shadow-xs transition hover:bg-paper-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <Refresh
                sx={{ fontSize: 18 }}
                aria-hidden
                className={stats.loading || apps.loading ? "animate-spin text-brand-600" : ""}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Bento Platform Pulse Grid */}
      {stats.error ? (
        <ErrorState message={stats.error} onRetry={stats.reload} />
      ) : stats.loading || !stats.data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="col-span-1 sm:col-span-2 h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
          <Skeleton className="h-44 rounded-2xl" />
        </div>
      ) : (
        <StatsGrid s={stats.data} pendingApps={pendingApps ?? 0} />
      )}

      {/* Mentor Applications Review Hub */}
      <Panel
        title="Mentor applications awaiting review"
        description="Prospective instructors and practitioners requesting course teaching assignments."
        actions={
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                (apps.data?.total ?? 0) > 0
                  ? "border-amber-300 bg-amber-50 text-amber-900"
                  : "border-rule bg-[#ffffff] text-muted"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  (apps.data?.total ?? 0) > 0 ? "bg-amber-600 animate-pulse" : "bg-muted"
                }`}
              />
              {apps.loading ? "Checking…" : `${apps.data?.total ?? 0} Pending`}
            </span>
            <Link
              href="/dashboard/admin/applications"
              className="text-xs font-semibold text-brand-700 transition hover:underline"
            >
              View all
            </Link>
          </div>
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
          <ul className="-my-2 divide-y divide-rule/70">
            {apps.data.applications.map((a) => (
              <li
                key={a.id}
                className="group flex flex-wrap items-center justify-between gap-4 py-4 transition hover:bg-paper-2/40 -mx-5 px-5 sm:-mx-6 sm:px-6"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-brand-200 bg-brand-50 font-display text-sm font-semibold text-brand-800 shadow-xs">
                    {(a.user?.firstName?.[0] ?? "").toUpperCase()}
                    {(a.user?.lastName?.[0] ?? "").toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{userName(a.user)}</p>
                    <p className="truncate text-xs text-ink-2">
                      Applied for{" "}
                      <span className="font-medium text-brand-800">{a.course.title}</span> ·{" "}
                      {formatDate(a.createdAt, { dateStyle: "medium" })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <StatusPill tone={statusTone(a.status)}>
                    {a.status.replace(/_/g, " ").toLowerCase()}
                  </StatusPill>
                  <Link
                    href={`/dashboard/admin/applications/${a.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-rule bg-[#ffffff] px-3 py-1.5 text-xs font-semibold text-ink shadow-xs transition hover:border-brand-300 hover:text-brand-800"
                  >
                    Review Dossier
                    <ArrowForward sx={{ fontSize: 13 }} aria-hidden />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 text-brand-700 shadow-xs">
              <Verified sx={{ fontSize: 30 }} aria-hidden />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold text-ink">
              Review queue is clear
            </h3>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-2 sm:text-sm">
              All submitted mentor applications have been reviewed. When new candidate dossiers arrive from the teaching portal, they will appear here automatically.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/dashboard/admin/applications"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-rule bg-[#ffffff] px-4 text-xs font-semibold text-ink shadow-xs transition hover:bg-paper-2 hover:border-brand-300"
              >
                Browse all applications
              </Link>
              <Link
                href="/dashboard/admin/mentors"
                className="inline-flex h-9 items-center justify-center rounded-xl bg-paper-2 px-4 text-xs font-semibold text-ink-2 transition hover:text-ink hover:bg-paper"
              >
                View active mentor faculty
              </Link>
            </div>
          </div>
        )}
      </Panel>

      {/* Creative Multi-Pod Workspace Command Center */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-[0.12em] text-brand-700">
              Administrative Command Center
            </p>
            <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Workspace & Platform Tools
            </h2>
          </div>
          <p className="text-xs text-muted">
            Direct shortcuts to course authoring, student records, community polls, and security.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Pod 1: Academic Studio */}
          <div className="flex flex-col rounded-2xl border border-rule bg-[#ffffff] p-5 shadow-elev1">
            <div className="flex items-center gap-2.5 border-b border-rule pb-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <MenuBook sx={{ fontSize: 18 }} aria-hidden />
              </div>
              <h3 className="font-display text-sm font-semibold text-ink">Academic Studio</h3>
            </div>
            <div className="mt-3.5 space-y-2 flex-1">
              <WorkspaceCommandCard
                href="/dashboard/admin/courses"
                title="Course Studio"
                description="Draft, structure chapters, and publish roadmaps"
                icon={<MenuBook sx={{ fontSize: 18 }} />}
              />
              <WorkspaceCommandCard
                href="/dashboard/admin/resources"
                title="Resource Library CMS"
                description="Manage open knowledge base, guides, and tracks"
                icon={<AutoStories sx={{ fontSize: 18 }} />}
              />
              <WorkspaceCommandCard
                href="/dashboard/admin/polls"
                title="Course Polling Arena"
                description="Monitor learner demand votes and incubate topics"
                icon={<HowToVote sx={{ fontSize: 18 }} />}
              />
              <WorkspaceCommandCard
                href="/dashboard/admin/courses/new"
                title="Create New Course"
                description="Launch new mentor-led roadmap with pricing"
                icon={<Add sx={{ fontSize: 18 }} />}
                highlight
              />
            </div>
          </div>

          {/* Pod 2: Community & Faculty */}
          <div className="flex flex-col rounded-2xl border border-rule bg-[#ffffff] p-5 shadow-elev1">
            <div className="flex items-center gap-2.5 border-b border-rule pb-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                <PeopleAlt sx={{ fontSize: 18 }} aria-hidden />
              </div>
              <h3 className="font-display text-sm font-semibold text-ink">Community & Faculty</h3>
            </div>
            <div className="mt-3.5 space-y-2 flex-1">
              <WorkspaceCommandCard
                href="/dashboard/admin/users"
                title="User Directory"
                description="Accounts, role assignments, and permissions"
                icon={<PeopleAlt sx={{ fontSize: 18 }} />}
              />
              <WorkspaceCommandCard
                href="/dashboard/admin/mentors"
                title="Mentor Faculty"
                description="Assigned courses, cohort access, and status"
                icon={<Handshake sx={{ fontSize: 18 }} />}
              />
              <WorkspaceCommandCard
                href="/dashboard/admin/applications"
                title="Applicant Queue"
                description="Screen candidate CVs and schedule interviews"
                icon={<AssignmentInd sx={{ fontSize: 18 }} />}
              />
              <WorkspaceCommandCard
                href="/dashboard/admin/inquiries"
                title="Tuition Inquiries"
                description="Parent and school partner coaching requests"
                icon={<Email sx={{ fontSize: 18 }} />}
              />
            </div>
          </div>

          {/* Pod 3: Governance & Commerce */}
          <div className="flex flex-col rounded-2xl border border-rule bg-[#ffffff] p-5 shadow-elev1">
            <div className="flex items-center gap-2.5 border-b border-rule pb-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                <Security sx={{ fontSize: 18 }} aria-hidden />
              </div>
              <h3 className="font-display text-sm font-semibold text-ink">Commerce & Governance</h3>
            </div>
            <div className="mt-3.5 space-y-2 flex-1">
              <WorkspaceCommandCard
                href="/dashboard/admin/analytics"
                title="Financial Analytics"
                description="Revenue breakdown, enrollment trends, and cohorts"
                icon={<Insights sx={{ fontSize: 18 }} />}
              />
              <WorkspaceCommandCard
                href="/dashboard/admin/orders"
                title="Orders & Invoices"
                description="Razorpay transaction receipts and payment status"
                icon={<Payment sx={{ fontSize: 18 }} />}
              />
              <WorkspaceCommandCard
                href="/dashboard/admin/cms"
                title="Website CMS Studio"
                description="Partner school logos, team pinboard, and media"
                icon={<Security sx={{ fontSize: 18 }} />}
              />
              <WorkspaceCommandCard
                href="/dashboard/admin/audit"
                title="Audit Log & Security"
                description="Administrative action logs and compliance history"
                icon={<Tune sx={{ fontSize: 18 }} />}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatsGrid({ s, pendingApps }: { s: AdminStats; pendingApps: number }) {
  const publishedPct = s.courses.total > 0 ? (s.courses.published / s.courses.total) * 100 : 0;
  const draftPct = s.courses.total > 0 ? (s.courses.draft / s.courses.total) * 100 : 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Hero Revenue Card (Spans 2 columns) */}
      <div className="relative col-span-1 sm:col-span-2 overflow-hidden rounded-2xl bg-gradient-to-br from-[#024059] via-[#024a35] to-[#025926] p-6 text-white shadow-elev2 flex flex-col justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/10 blur-2xl"
        />
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur">
                <CurrencyRupee sx={{ fontSize: 20 }} aria-hidden />
              </div>
              <span className="font-mono text-xs font-semibold uppercase tracking-wider text-brand-100">
                Settled Revenue (Paid)
              </span>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-brand-100">
              Razorpay Live
            </span>
          </div>

          <p className="mt-4 font-display text-4xl sm:text-5xl font-semibold tracking-tight text-white tabular-nums">
            {formatMoney(s.revenuePaise)}
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/15 pt-3.5 text-xs text-brand-100/90">
          <span>
            <strong className="text-white font-semibold">{s.paidOrders}</strong> paid orders processed
          </span>
          <Link
            href="/dashboard/admin/orders"
            className="inline-flex items-center gap-1 font-semibold text-white underline decoration-white/40 underline-offset-4 transition hover:decoration-white"
          >
            View transaction ledger
            <ArrowForward sx={{ fontSize: 13 }} aria-hidden />
          </Link>
        </div>
      </div>

      {/* Users Metric */}
      <MetricCard
        label="Registered Users"
        value={s.users}
        hint={`+${s.newUsers} in last 7 days`}
        icon={<PeopleAlt sx={{ fontSize: 20 }} />}
        href="/dashboard/admin/users"
      />

      {/* Active Learners Metric */}
      <MetricCard
        label="Active Learners"
        value={s.activeLearners}
        hint="Learners with active seats"
        icon={<School sx={{ fontSize: 20 }} />}
        href="/dashboard/admin/analytics"
      />

      {/* Active Mentors Metric */}
      <MetricCard
        label="Active Mentors"
        value={s.mentors}
        hint="Mentors leading cohorts"
        icon={<Handshake sx={{ fontSize: 20 }} />}
        href="/dashboard/admin/mentors"
      />

      {/* Total Enrolments Metric */}
      <MetricCard
        label="Total Enrolments"
        value={s.enrollments}
        hint="Cumulative learner enrollments"
        icon={<CheckCircle sx={{ fontSize: 20 }} />}
        href="/dashboard/admin/courses"
      />

      {/* Course Catalog Health Card */}
      <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-rule bg-[#ffffff] p-5 shadow-elev1 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-elev2">
        <Link href="/dashboard/admin/courses" className="absolute inset-0 z-10" aria-label="View Courses" />
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.12em] text-muted">
                Course Catalog
              </p>
              <p className="mt-2 font-display text-2xl sm:text-[28px] font-semibold leading-tight tracking-tight text-ink tabular-nums">
                {s.courses.total}
              </p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rule/80 bg-paper-2 text-ink-2 shadow-xs group-hover:border-brand-300 group-hover:bg-brand-50/60 group-hover:text-brand-800">
              <MenuBook sx={{ fontSize: 20 }} aria-hidden />
            </div>
          </div>

          {/* Miniature Visual Proportions Bar */}
          <div className="mt-3.5 flex h-1.5 w-full overflow-hidden rounded-full bg-paper-2">
            <div style={{ width: `${publishedPct}%` }} className="bg-brand-600" title={`Published: ${s.courses.published}`} />
            <div style={{ width: `${draftPct}%` }} className="bg-amber-400" title={`Draft: ${s.courses.draft}`} />
          </div>
        </div>

        <div className="mt-3.5 flex items-center justify-between border-t border-rule/70 pt-2.5 text-xs text-ink-2">
          <span>{s.courses.published} live · {s.courses.draft} draft</span>
          <ArrowForward sx={{ fontSize: 13 }} className="text-muted group-hover:translate-x-0.5 group-hover:text-brand-700" />
        </div>
      </div>

      {/* Pending Applications Alert Metric */}
      <MetricCard
        label="Pending Applications"
        value={pendingApps}
        tone={pendingApps > 0 ? "warn" : "default"}
        hint={pendingApps > 0 ? `${pendingApps} awaiting your review` : "Review queue clear"}
        icon={<AssignmentInd sx={{ fontSize: 20 }} />}
        href="/dashboard/admin/applications"
      />

      {/* Payment Gateway Health */}
      <MetricCard
        label="Gateway Transactions"
        value={s.payments.ok}
        tone={s.payments.failed > 0 ? "danger" : "default"}
        hint={`${s.payments.failed} failed transaction${s.payments.failed === 1 ? "" : "s"}`}
        icon={<Payment sx={{ fontSize: 20 }} />}
        href="/dashboard/admin/orders"
      />
    </div>
  );
}

function WorkspaceCommandCard({
  href,
  title,
  description,
  icon,
  highlight = false,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-start gap-3 rounded-xl border p-3 transition-all duration-200 ${
        highlight
          ? "border-brand-200 bg-brand-50/30 hover:border-brand-300 hover:bg-brand-50/70"
          : "border-rule/80 bg-paper/50 hover:border-brand-300 hover:bg-paper-2 hover:shadow-xs"
      }`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border shadow-xs transition-transform duration-200 group-hover:scale-105 ${
          highlight
            ? "border-brand-300 bg-brand-600 text-white"
            : "border-rule bg-[#ffffff] text-ink-2 group-hover:text-brand-700 group-hover:border-brand-200"
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <p className="font-display text-sm font-semibold text-ink group-hover:text-brand-800 transition-colors">
            {title}
          </p>
          <ArrowForward
            sx={{ fontSize: 13 }}
            className="text-muted opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-brand-700"
          />
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-ink-2/80">{description}</p>
      </div>
    </Link>
  );
}
