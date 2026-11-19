"use client";

import { useState } from "react";
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
import TrendingUp from "@mui/icons-material/TrendingUp";

import { apiGet } from "@/lib/api";
import type { AdminApplicationRow, AdminStats } from "@/lib/app-types";
import { formatDate, formatMoney } from "@/lib/format";
import ErrorState from "@/components/ui/ErrorState";
import { useAuth } from "../AuthProvider";
import { Skeleton, StatusPill, statusTone, useAsync, userName } from "./admin-ui";

const PENDING = ["SUBMITTED", "UNDER_REVIEW", "INTERVIEW_SCHEDULED"];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"applications" | "catalog" | "health">("applications");

  const stats = useAsync(() => apiGet<AdminStats>("/admin/stats"), []);
  const apps = useAsync(
    () =>
      apiGet<{ applications: AdminApplicationRow[]; total: number }>("/applications", {
        status: "SUBMITTED",
        limit: 5,
      }),
    [],
  );

  const pendingApps = stats.data
    ? PENDING.reduce((sum, k) => sum + (stats.data!.applications[k] ?? 0), 0)
    : 0;

  return (
    <div className="space-y-8">
      {/* Cockpit Status HUD Header */}
      <header className="rounded-3xl border border-rule bg-[#ffffff] p-5 shadow-elev1 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-[11px] font-mono font-semibold uppercase tracking-wider text-brand-800">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-600 animate-pulse" />
                Live Cockpit
              </span>
              <span className="text-xs font-mono text-muted">
                EduAltTech OS · Executive Hub
              </span>
            </div>

            <h1 className="mt-2.5 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Platform Command Console
            </h1>

            <p className="mt-1 text-xs text-ink-2 sm:text-sm">
              Welcome back, <strong className="font-semibold text-ink">{user?.firstName || "Admin"}</strong>.{" "}
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              · Monitoring active cohorts, teaching pipelines, and live enrollment traffic.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Link
              href="/dashboard/admin/courses/new"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#025926] px-4 text-xs font-semibold text-white shadow-elev1 transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <Add sx={{ fontSize: 16 }} aria-hidden />
              New course
            </Link>

            <Link
              href="/dashboard/admin/users"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-rule bg-paper px-3.5 text-xs font-semibold text-ink shadow-xs transition hover:bg-paper-2 hover:border-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <PeopleAlt sx={{ fontSize: 16 }} aria-hidden className="text-muted" />
              Users
            </Link>

            <button
              type="button"
              onClick={() => {
                stats.reload();
                apps.reload();
              }}
              title="Sync live platform data"
              aria-label="Sync live platform data"
              className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-rule bg-paper text-ink-2 shadow-xs transition hover:bg-paper-2 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
            >
              <Refresh
                sx={{ fontSize: 17 }}
                aria-hidden
                className={stats.loading || apps.loading ? "animate-spin text-brand-600" : ""}
              />
            </button>
          </div>
        </div>
      </header>

      {/* Asymmetric 2-Column Cockpit Grid */}
      <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
        {/* Left Section (8 cols): Core Metrics & Interactive Console */}
        <div className="space-y-6 lg:col-span-8">
          {/* 4 High-Impact Cockpit Gauges */}
          {stats.error ? (
            <ErrorState message={stats.error} onRetry={stats.reload} />
          ) : stats.loading || !stats.data ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
              <Skeleton className="h-44 rounded-2xl" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Gauge 1: Revenue Stream */}
              <div className="relative overflow-hidden rounded-2xl bg-[#024059] p-5 text-white shadow-elev2 flex flex-col justify-between">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-xl"
                />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-brand-200">
                      Paid Revenue
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10.5px] font-semibold text-white">
                      Razorpay
                    </span>
                  </div>
                  <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-white tabular-nums sm:text-4xl">
                    {formatMoney(stats.data.revenuePaise)}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-white/15 pt-3 text-xs text-white/80">
                  <span>{stats.data.paidOrders} verified orders</span>
                  <Link
                    href="/dashboard/admin/orders"
                    className="inline-flex items-center gap-1 font-semibold text-white transition hover:underline"
                  >
                    Ledger
                    <ArrowForward sx={{ fontSize: 13 }} aria-hidden />
                  </Link>
                </div>
              </div>

              {/* Gauge 2: Community & Growth */}
              <div className="flex flex-col justify-between rounded-2xl border border-rule bg-[#ffffff] p-5 shadow-elev1">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Total Community
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                      <PeopleAlt sx={{ fontSize: 17 }} aria-hidden />
                    </div>
                  </div>
                  <p className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink tabular-nums sm:text-4xl">
                    {stats.data.users}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-rule/70 pt-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-brand-700 font-semibold">
                    <TrendingUp sx={{ fontSize: 14 }} aria-hidden />
                    +{stats.data.newUsers} in last 7 days
                  </span>
                  <Link
                    href="/dashboard/admin/users"
                    className="font-semibold text-ink-2 hover:text-brand-700 transition"
                  >
                    Directory →
                  </Link>
                </div>
              </div>

              {/* Gauge 3: Classroom Dual-Metric (Learners & Mentors) */}
              <div className="flex flex-col justify-between rounded-2xl border border-rule bg-[#ffffff] p-5 shadow-elev1">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Active Classroom
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <School sx={{ fontSize: 17 }} aria-hidden />
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 divide-x divide-rule/70">
                    <div>
                      <p className="font-display text-2xl font-semibold text-ink sm:text-3xl tabular-nums">
                        {stats.data.activeLearners}
                      </p>
                      <p className="text-[11px] text-muted">Active learners</p>
                    </div>
                    <div className="pl-3">
                      <p className="font-display text-2xl font-semibold text-ink sm:text-3xl tabular-nums">
                        {stats.data.mentors}
                      </p>
                      <p className="text-[11px] text-muted">Active mentors</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-rule/70 pt-3 text-xs text-ink-2">
                  <span>{stats.data.enrollments} total seats claimed</span>
                  <Link
                    href="/dashboard/admin/analytics"
                    className="font-semibold text-ink-2 hover:text-brand-700 transition"
                  >
                    Analytics →
                  </Link>
                </div>
              </div>

              {/* Gauge 4: Course Offerings Health */}
              <div className="flex flex-col justify-between rounded-2xl border border-rule bg-[#ffffff] p-5 shadow-elev1">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Course Offerings
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                      <MenuBook sx={{ fontSize: 17 }} aria-hidden />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <p className="font-display text-3xl font-semibold text-ink sm:text-4xl tabular-nums">
                      {stats.data.courses.total}
                    </p>
                    <span className="text-xs text-ink-2">
                      ({stats.data.courses.published} published · {stats.data.courses.draft} draft)
                    </span>
                  </div>
                  <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-paper-2">
                    <div
                      style={{
                        width: `${
                          stats.data.courses.total > 0
                            ? (stats.data.courses.published / stats.data.courses.total) * 100
                            : 0
                        }%`,
                      }}
                      className="bg-brand-600"
                    />
                    <div
                      style={{
                        width: `${
                          stats.data.courses.total > 0
                            ? (stats.data.courses.draft / stats.data.courses.total) * 100
                            : 0
                        }%`,
                      }}
                      className="bg-amber-400"
                    />
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-rule/70 pt-3 text-xs text-ink-2">
                  <span>Catalog in healthy state</span>
                  <Link
                    href="/dashboard/admin/courses"
                    className="font-semibold text-ink-2 hover:text-brand-700 transition"
                  >
                    Studio →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Operations Console Tabs */}
          <div className="overflow-hidden rounded-2xl border border-rule bg-[#ffffff] shadow-elev1">
            {/* Console Tab Switcher Bar */}
            <div className="flex flex-wrap items-center justify-between border-b border-rule bg-paper/60 px-5 py-3 sm:px-6">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab("applications")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === "applications"
                      ? "bg-[#ffffff] text-ink shadow-xs border border-rule"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  Applicant Queue ({pendingApps})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("catalog")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === "catalog"
                      ? "bg-[#ffffff] text-ink shadow-xs border border-rule"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  Catalog Health
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("health")}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    activeTab === "health"
                      ? "bg-[#ffffff] text-ink shadow-xs border border-rule"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  Gateway & Security
                </button>
              </div>

              <span className="text-[11px] font-mono font-medium text-muted">
                Admin Console Mode
              </span>
            </div>

            {/* Tab Body */}
            <div className="p-5 sm:p-6">
              {activeTab === "applications" && (
                <div>
                  {apps.error ? (
                    <ErrorState message={apps.error} onRetry={apps.reload} />
                  ) : apps.loading && !apps.data ? (
                    <div className="space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-xl" />
                      ))}
                    </div>
                  ) : apps.data && apps.data.applications.length > 0 ? (
                    <div className="divide-y divide-rule/70">
                      {apps.data.applications.map((a) => (
                        <div
                          key={a.id}
                          className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-brand-200 bg-brand-50 text-xs font-semibold text-brand-800">
                              {(a.user?.firstName?.[0] ?? "").toUpperCase()}
                              {(a.user?.lastName?.[0] ?? "").toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-ink text-sm">
                                {userName(a.user)}
                              </p>
                              <p className="truncate text-xs text-muted">
                                {a.course.title} · {formatDate(a.createdAt, { dateStyle: "medium" })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusPill tone={statusTone(a.status)}>
                              {a.status.replace(/_/g, " ").toLowerCase()}
                            </StatusPill>
                            <Link
                              href={`/dashboard/admin/applications/${a.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-rule bg-paper px-3 py-1.5 text-xs font-semibold text-ink transition hover:border-brand-300 hover:text-brand-800"
                            >
                              Review
                              <ArrowForward sx={{ fontSize: 13 }} aria-hidden />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 text-brand-700">
                        <Verified sx={{ fontSize: 26 }} aria-hidden />
                      </div>
                      <p className="mt-3 font-display text-base font-semibold text-ink">
                        Application Queue Is Clear
                      </p>
                      <p className="mt-1 text-xs text-ink-2 max-w-sm">
                        All mentor applicant files are currently resolved. New instructor applications will appear here in real time.
                      </p>
                      <Link
                        href="/dashboard/admin/applications"
                        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                      >
                        View complete application history →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "catalog" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-rule/80 bg-paper p-3.5">
                      <p className="text-[11px] font-mono text-muted uppercase">Published</p>
                      <p className="mt-1 font-display text-2xl font-semibold text-ink">
                        {stats.data?.courses.published ?? 0}
                      </p>
                      <p className="mt-0.5 text-xs text-brand-700 font-medium">Live on catalog</p>
                    </div>
                    <div className="rounded-xl border border-rule/80 bg-paper p-3.5">
                      <p className="text-[11px] font-mono text-muted uppercase">Drafts</p>
                      <p className="mt-1 font-display text-2xl font-semibold text-ink">
                        {stats.data?.courses.draft ?? 0}
                      </p>
                      <p className="mt-0.5 text-xs text-amber-700 font-medium">In authoring</p>
                    </div>
                    <div className="rounded-xl border border-rule/80 bg-paper p-3.5">
                      <p className="text-[11px] font-mono text-muted uppercase">Archived</p>
                      <p className="mt-1 font-display text-2xl font-semibold text-ink">
                        {stats.data?.courses.archived ?? 0}
                      </p>
                      <p className="mt-0.5 text-xs text-muted font-medium">Retired</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-rule/70 pt-3 text-xs">
                    <span className="text-muted">Need to publish an incubating course?</span>
                    <Link
                      href="/dashboard/admin/courses"
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      Open Course Studio →
                    </Link>
                  </div>
                </div>
              )}

              {activeTab === "health" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-rule/80 bg-paper p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-muted uppercase">Payments OK</span>
                        <span className="h-2 w-2 rounded-full bg-brand-600" />
                      </div>
                      <p className="mt-1 font-display text-2xl font-semibold text-ink">
                        {stats.data?.payments.ok ?? 0}
                      </p>
                      <p className="mt-0.5 text-xs text-brand-700">Settled cleanly</p>
                    </div>
                    <div className="rounded-xl border border-rule/80 bg-paper p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-muted uppercase">Failed Transactions</span>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            (stats.data?.payments.failed ?? 0) > 0 ? "bg-red-500" : "bg-muted"
                          }`}
                        />
                      </div>
                      <p className="mt-1 font-display text-2xl font-semibold text-ink">
                        {stats.data?.payments.failed ?? 0}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">Requires reconciliation</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t border-rule/70 pt-3 text-xs">
                    <span className="text-muted">Razorpay Webhooks & Gateway</span>
                    <Link
                      href="/dashboard/admin/orders"
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      Inspect Order Ledger →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Section (4 cols): Sticky Administrative Launchpad */}
        <div className="space-y-6 lg:col-span-4">
          {/* Quick Launchpad Deck */}
          <div className="rounded-2xl border border-rule bg-[#ffffff] p-5 shadow-elev1">
            <div className="flex items-center justify-between border-b border-rule pb-3.5">
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                Command Deck
              </p>
              <span className="text-[11px] font-medium text-muted">Quick Launch</span>
            </div>

            <div className="mt-3.5 space-y-1.5">
              <DeckItem
                href="/dashboard/admin/courses"
                title="Courses & Roadmaps"
                sub="Syllabi, chapters & pricing"
                icon={<MenuBook sx={{ fontSize: 16 }} />}
              />
              <DeckItem
                href="/dashboard/admin/users"
                title="User Directory"
                sub="Accounts, roles & access"
                icon={<PeopleAlt sx={{ fontSize: 16 }} />}
              />
              <DeckItem
                href="/dashboard/admin/mentors"
                title="Mentor Faculty"
                sub="Teaching assignments"
                icon={<Handshake sx={{ fontSize: 16 }} />}
              />
              <DeckItem
                href="/dashboard/admin/applications"
                title="Applicant Queue"
                sub={`${pendingApps} awaiting review`}
                icon={<AssignmentInd sx={{ fontSize: 16 }} />}
                alert={pendingApps > 0}
              />
              <DeckItem
                href="/dashboard/admin/polls"
                title="Course Polling"
                sub="Community student demand"
                icon={<HowToVote sx={{ fontSize: 16 }} />}
              />
              <DeckItem
                href="/dashboard/admin/resources"
                title="Resource CMS"
                sub="Free knowledge base"
                icon={<AutoStories sx={{ fontSize: 16 }} />}
              />
              <DeckItem
                href="/dashboard/admin/orders"
                title="Orders & Invoices"
                sub="Razorpay transaction logs"
                icon={<Payment sx={{ fontSize: 16 }} />}
              />
              <DeckItem
                href="/dashboard/admin/analytics"
                title="Analytics Trends"
                sub="Revenue & student traffic"
                icon={<Insights sx={{ fontSize: 16 }} />}
              />
              <DeckItem
                href="/dashboard/admin/cms"
                title="Website CMS"
                sub="Partners, team & media"
                icon={<Security sx={{ fontSize: 16 }} />}
              />
              <DeckItem
                href="/dashboard/admin/inquiries"
                title="Tuition Inquiries"
                sub="Parent & student coaching"
                icon={<Email sx={{ fontSize: 16 }} />}
              />
              <DeckItem
                href="/dashboard/admin/audit"
                title="Audit & Security"
                sub="Admin action history"
                icon={<Tune sx={{ fontSize: 16 }} />}
              />
            </div>
          </div>

          {/* Compliance & Standards Card */}
          <div className="rounded-2xl border border-rule bg-paper p-5 text-xs shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-ink font-semibold">
              <CheckCircle sx={{ fontSize: 16 }} className="text-brand-600" aria-hidden />
              <span>Platform Verification</span>
            </div>
            <ul className="space-y-1.5 text-ink-2">
              <li className="flex items-center justify-between">
                <span>Accreditation:</span>
                <span className="font-semibold text-ink">Govt. MSME Enterprise</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Payment Gateway:</span>
                <span className="font-semibold text-brand-700">Razorpay Live</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Cohort Standard:</span>
                <span className="font-semibold text-ink">Max 15 per batch</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeckItem({
  href,
  title,
  sub,
  icon,
  alert = false,
}: {
  href: string;
  title: string;
  sub: string;
  icon: React.ReactNode;
  alert?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group flex items-center justify-between rounded-xl px-3 py-2 transition ${
        alert
          ? "bg-amber-50/70 border border-amber-200 text-amber-950 hover:bg-amber-100/60"
          : "hover:bg-paper-2 text-ink"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-xs shadow-xs transition group-hover:scale-105 ${
            alert
              ? "border-amber-300 bg-[#ffffff] text-amber-700"
              : "border-rule bg-[#ffffff] text-ink-2 group-hover:text-brand-700 group-hover:border-brand-300"
          }`}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold text-ink group-hover:text-brand-800 truncate">
            {title}
          </p>
          <p className="text-[11px] text-muted truncate">{sub}</p>
        </div>
      </div>
      <ArrowForward
        sx={{ fontSize: 12 }}
        className="text-muted shrink-0 opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-brand-700"
      />
    </Link>
  );
}
