"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, apiGet, apiPatch } from "@/lib/api";
import type { AdminCourseSummary } from "@/lib/app-types";
import { formatDate, formatMoney } from "@/lib/format";
import { notifySuccess } from "@/lib/notify";
import Button, { buttonClass } from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import { AdminHeader, Panel, Skeleton, StatusPill, statusTone, useAsync, useDebouncedValue } from "./admin-ui";

const LIMIT = 20;
type Status = "" | "DRAFT" | "PUBLISHED" | "ARCHIVED";

interface CoursesResponse {
  courses: AdminCourseSummary[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

function courseError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.code === "ROADMAP_INCOMPLETE") return "Add at least one chapter with a topic before publishing.";
    if (err.code === "HAS_ORDERS") return "Paid orders exist — archive the course instead of deleting.";
    if (err.code === "HAS_PARTICIPANTS") return "Enrolled participants exist — archive the course instead.";
    if (err.code === "FORBIDDEN" || err.status === 403) return "You don’t have permission for this course action.";
    if (err.code === "UNAUTHORIZED" || err.status === 401) return "Your session expired. Please sign in again.";
    if (err.code === "RATE_LIMITED" || err.status === 429) return "Too many requests. Please wait a moment.";
    if (err.code === "INVALID_TRANSITION" || err.code === "VALIDATION_ERROR") return err.message;
  }
  return err instanceof Error ? err.message : fallback;
}

export default function AdminCourses() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<Status>("");
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, status]);

  const { data, error, loading, reload } = useAsync(
    () =>
      apiGet<CoursesResponse>("/admin/courses", {
        ...(debouncedQuery.trim() ? { q: debouncedQuery.trim() } : {}),
        ...(status ? { status } : {}),
        page,
        limit: LIMIT,
      }),
    [debouncedQuery, status, page],
  );

  const filtersActive = query.trim().length > 0 || status !== "";

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Course management"
        description="Draft, publish and maintain the catalogue. Publishing requires at least one chapter with a topic."
        actions={
          <Link href="/dashboard/admin/courses/new" className={buttonClass("primary", "sm")}>
            New course
          </Link>
        }
      />

      <Panel>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label htmlFor="course-search" className="mb-1 block text-sm font-semibold text-ink-700">Search</label>
            <Input id="course-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Course title" />
          </div>
          <div>
            <label htmlFor="course-status" className="mb-1 block text-sm font-semibold text-ink-700">Status</label>
            <select
              id="course-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            >
              <option value="">All statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </select>
          </div>
          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setStatus(""); }}>
              Clear filters
            </Button>
          )}
        </div>
      </Panel>

      <Panel
        title="Catalogue"
        description={data ? `${data.total} course${data.total === 1 ? "" : "s"}${filtersActive ? " matching filters" : ""}` : undefined}
        actions={
          data && (
            <span className="text-sm text-slate-500">
              Page {data.page} of {Math.max(1, Math.ceil(data.total / LIMIT))}
            </span>
          )
        }
      >
        {error ? (
          <ErrorState message={courseError(error, "Could not load courses.")} onRetry={reload} />
        ) : loading && !data ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 rounded-xl" />
            ))}
          </div>
        ) : data && data.courses.length === 0 ? (
          <EmptyState
            title={filtersActive ? "No matching courses" : "No courses yet"}
            description={filtersActive ? "Try a different search or clear the filters." : "Create the first course to get started."}
            action={
              !filtersActive ? (
                <Link href="/dashboard/admin/courses/new" className={buttonClass("primary", "sm")}>
                  New course
                </Link>
              ) : undefined
            }
          />
        ) : data ? (
          <>
            <ul className="divide-y divide-slate-100">
              {data.courses.map((c) => (
                <CourseRow key={c.id} course={c} onChanged={reload} />
              ))}
            </ul>
            <div className="mt-4 flex items-center justify-between">
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
                Previous
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={!data.hasMore || loading}>
                Next
              </Button>
            </div>
          </>
        ) : null}
      </Panel>
    </div>
  );
}

function CourseRow({ course, onChanged }: { course: AdminCourseSummary; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<null | { status: "PUBLISHED" | "DRAFT" | "ARCHIVED"; label: string; detail: string }>(null);

  async function apply(next: "PUBLISHED" | "DRAFT" | "ARCHIVED") {
    setBusy(true);
    setError(null);
    try {
      await apiPatch(`/courses/${course.id}`, { status: next });
      notifySuccess(`Course moved to ${next.toLowerCase()}`);
      setConfirm(null);
      onChanged();
    } catch (err) {
      setError(courseError(err, "Could not update the course."));
    } finally {
      setBusy(false);
    }
  }

  const actions: { label: string; next: "PUBLISHED" | "DRAFT" | "ARCHIVED"; confirm?: { detail: string } }[] =
    course.status === "DRAFT"
      ? [
          { label: "Publish", next: "PUBLISHED", confirm: { detail: "Learners will see this course in the catalogue." } },
          { label: "Archive", next: "ARCHIVED", confirm: { detail: "It stays in the system but is hidden from learners." } },
        ]
      : course.status === "PUBLISHED"
        ? [
            { label: "Unpublish", next: "DRAFT", confirm: { detail: "It will be hidden from the catalogue until republished." } },
            { label: "Archive", next: "ARCHIVED", confirm: { detail: "It stays in the system but is hidden from learners." } },
          ]
        : [{ label: "Restore to draft", next: "DRAFT" }];

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/dashboard/admin/courses/${course.id}`} className="font-semibold text-ink-900 hover:text-brand-700">
              {course.title}
            </Link>
            <StatusPill tone={statusTone(course.status)}>{course.status.toLowerCase()}</StatusPill>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {course.category} · {course.pricePaise > 0 ? formatMoney(course.pricePaise, course.currency) : "Free"} ·{" "}
            {course._count.participants} learner{course._count.participants === 1 ? "" : "s"} · {course._count.chapters} chapter
            {course._count.chapters === 1 ? "" : "s"}
            {course.createdBy ? ` · by ${course.createdBy.firstName} ${course.createdBy.lastName}` : ""} ·{" "}
            {formatDate(course.createdAt, { dateStyle: "medium" })}
          </p>
          {error && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              {error}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/dashboard/admin/courses/${course.id}`} className={buttonClass("secondary", "sm")}>
            Manage
          </Link>
          {actions.map((a) =>
            a.confirm ? (
              <Button key={a.label} variant="ghost" size="sm" disabled={busy} onClick={() => setConfirm({ status: a.next, label: a.label, detail: a.confirm!.detail })}>
                {a.label}
              </Button>
            ) : (
              <Button key={a.label} variant="ghost" size="sm" loading={busy} onClick={() => apply(a.next)}>
                {a.label}
              </Button>
            ),
          )}
        </div>
      </div>

      {confirm && (
        <div role="alertdialog" aria-modal="true" aria-label={`Confirm ${confirm.label}`} className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-sm text-amber-900">{confirm.detail}</p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" loading={busy} onClick={() => apply(confirm.status)}>
              Confirm {confirm.label.toLowerCase()}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirm(null)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
