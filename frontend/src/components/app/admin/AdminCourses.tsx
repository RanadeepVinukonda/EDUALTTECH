"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { ApiError, apiGet, apiPatch } from "@/lib/api";
import type { AdminCourseSummary } from "@/lib/app-types";
import { formatMoney } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/notify";
import Button, { buttonClass } from "@/components/ui/Button";

import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Search from "@mui/icons-material/Search";
import School from "@mui/icons-material/School";
import Flag from "@mui/icons-material/Flag";
import Article from "@mui/icons-material/Article";
import LandingCourseCard from "@/components/landing/CourseCard";
import { AdminHeader, ConfirmDialog, Pagination, Panel, Skeleton, useAsync, useDebouncedValue } from "./admin-ui";

const LIMIT = 5;
type Status = "" | "DRAFT" | "PUBLISHED" | "ARCHIVED";
type TypeFilter = "" | "EDUCATION" | "ALTERNATIVE_EDUCATION";
type OfferingFilter = "" | "RESOURCE" | "COURSE";

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
  const [type, setType] = useState<TypeFilter>("");
  const [offering, setOffering] = useState<OfferingFilter>("");
  const [page, setPage] = useState(1);
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, status, type, offering]);

  const { data, error, loading, reload } = useAsync(
    () =>
      apiGet<CoursesResponse>("/admin/courses", {
        ...(debouncedQuery.trim() ? { q: debouncedQuery.trim() } : {}),
        ...(status ? { status } : {}),
        ...(type ? { type } : {}),
        ...(offering ? { kind: offering } : {}),
        page,
        limit: LIMIT,
      }),
    [debouncedQuery, status, type, offering, page],
  );

  const filtersActive = query.trim().length > 0 || status !== "" || type !== "" || offering !== "";

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Course management"
        description="Draft, publish and maintain the catalogue."
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
            <Input id="course-search" type="search" value={query} icon={<Search fontSize="small" />} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Intro to design…" />
          </div>
          <div>
            <label htmlFor="course-status" className="mb-1 block text-sm font-semibold text-ink-700">Status</label>
            <Select
              id="course-status"
              value={status}
              icon={<Flag fontSize="small" />}
              className="w-auto"
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              <option value="">All statuses</option>
              <option value="DRAFT">DRAFT</option>
              <option value="PUBLISHED">PUBLISHED</option>
              <option value="ARCHIVED">ARCHIVED</option>
            </Select>
          </div>
          <div>
            <label htmlFor="course-offering" className="mb-1 block text-sm font-semibold text-ink-700">Offering</label>
            <Select
              id="course-offering"
              value={offering}
              icon={<Article fontSize="small" />}
              className="w-auto"
              onChange={(e) => setOffering(e.target.value as OfferingFilter)}
            >
              <option value="">All offerings</option>
              <option value="COURSE">Courses</option>
              <option value="RESOURCE">Resources</option>
            </Select>
          </div>
          <div>
            <label htmlFor="course-type" className="mb-1 block text-sm font-semibold text-ink-700">Type</label>
            <Select
              id="course-type"
              value={type}
              icon={<School fontSize="small" />}
              className="w-auto"
              onChange={(e) => setType(e.target.value as TypeFilter)}
            >
              <option value="">All types</option>
              <option value="EDUCATION">Education</option>
              <option value="ALTERNATIVE_EDUCATION">Alternative education</option>
            </Select>
          </div>
          {filtersActive && (
            <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setStatus(""); setType(""); setOffering(""); }}>
              Clear filters
            </Button>
          )}
        </div>
      </Panel>

      <Panel
        title="Catalogue"
        description={data ? `${data.total} course${data.total === 1 ? "" : "s"}${filtersActive ? " matching filters" : ""}` : undefined}
      >
        {error ? (
          <ErrorState message={courseError(error, "Could not load courses.")} onRetry={reload} />
        ) : loading && !data ? (
          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
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
            <ul className="grid gap-5 md:grid-cols-2">
              {data.courses.map((c) => (
                <CourseCard key={c.id} course={c} onChanged={reload} />
              ))}
            </ul>
            <div className="mt-6">
              <Pagination page={data.page} total={data.total} limit={LIMIT} hasMore={data.hasMore} busy={loading} onChange={setPage} />
            </div>
          </>
        ) : null}
      </Panel>
    </div>
  );
}

function CourseCard({ course, onChanged }: { course: AdminCourseSummary; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<null | { status: "PUBLISHED" | "DRAFT" | "ARCHIVED"; label: string; detail: string }>(null);

  async function apply(next: "PUBLISHED" | "DRAFT" | "ARCHIVED") {
    setBusy(true);
    try {
      await apiPatch(`/courses/${course.id}`, { status: next });
      notifySuccess(`Course moved to ${next.toLowerCase()}`);
      setConfirm(null);
      onChanged();
    } catch (err) {
      notifyError(courseError(err, "Could not update the course."));
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
        : [{ label: "Restore", next: "DRAFT" }];

  return (
    <>
      <LandingCourseCard
        course={course}
        href={`/dashboard/admin/courses/${course.id}`}
        badge={`${course.features.includes("100% Free Resource") ? "resource" : "course"} · ${course.status.toLowerCase()}`}
        priceLabel={course.pricePaise > 0 ? formatMoney(course.pricePaise, course.currency) : "Free"}
        stats={[
          { label: "Learners", value: String(course._count.participants) },
          { label: "Chapters", value: String(course._count.chapters) },
        ]}
        actions={
          <>
            {actions.map((a) => (
              <Button
                key={a.label}
                variant="ghost"
                size="sm"
                disabled={busy}
                onClick={() => (a.confirm ? setConfirm({ status: a.next, label: a.label, detail: a.confirm.detail }) : void apply(a.next))}
              >
                {a.label}
              </Button>
            ))}
          </>
        }
        viewLabel={`Open ${course.title}`}
      />
      <ConfirmDialog
        open={Boolean(confirm)}
        title={`${confirm?.label ?? "Update"} course`}
        confirmLabel={confirm?.label ?? "Confirm"}
        tone={confirm?.status === "ARCHIVED" ? "danger" : "primary"}
        busy={busy}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && void apply(confirm.status)}
      >
        {confirm?.detail}
      </ConfirmDialog>
    </>
  );
}
