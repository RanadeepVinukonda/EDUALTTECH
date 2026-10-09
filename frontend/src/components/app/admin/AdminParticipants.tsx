"use client";

import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { CourseDetailResponse } from "@/lib/app-types";
import { formatPrice } from "@/lib/format";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { AdminHeader, MetricCard, Panel, Skeleton, StatusPill, useAsync, userName } from "./admin-ui";

export default function AdminParticipants({ courseId }: { courseId: string }) {
  const detail = useAsync(() => apiGet<CourseDetailResponse>(`/courses/${courseId}`), [courseId]);

  if (detail.error) return <ErrorState message={detail.error} onRetry={detail.reload} />;
  if (detail.loading && !detail.data) return <Skeleton className="h-96 rounded-[20px]" />;
  if (!detail.data) return <EmptyState title="Course not found" description="This course may have been removed." />;

  const course = detail.data.course;
  const mentors = course.mentors ?? [];

  return (
    <div className="space-y-6">
      <AdminHeader
        title={`Participants — ${course.title}`}
        description="Course-specific participation. MENTOR and LEARNER are per-course roles, never global account roles."
        actions={
          <Link href={`/dashboard/admin/courses/${course.id}`} className="text-sm font-semibold text-brand-700 hover:underline">
            ← Course editor
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Enrolled learners" value={String(course.enrolledCount)} />
        <MetricCard label="Mentors" value={String(mentors.length)} />
        <MetricCard label="Price" value={formatPrice(course.pricePaise)} />
      </div>

      <Panel title="Mentors" description="Mentors are the only participants the backend exposes for a course.">
        {mentors.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2 font-semibold">Mentor</th>
                  <th className="px-2 py-2 font-semibold">Capacity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mentors.map((m, i) => (
                  <tr key={m.user.id ?? i}>
                    <td className="px-2 py-3">
                      <p className="font-semibold text-ink-900">{userName(m.user)}</p>
                      {m.user.bio && <p className="line-clamp-1 text-xs text-slate-500">{m.user.bio}</p>}
                    </td>
                    <td className="px-2 py-3 text-slate-600">{m.capacity ?? "platform default"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No mentors assigned"
            description="Assign mentors from the Mentor management screen."
            action={
              <Link href="/dashboard/admin/mentors" className="text-sm font-semibold text-brand-700 hover:underline">
                Go to Mentor management →
              </Link>
            }
          />
        )}
      </Panel>

      <div className="flex items-start gap-3 rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <StatusPill tone="warn">gap</StatusPill>
        <p>
          The backend exposes <span className="font-semibold">no learner roster</span> and no endpoints to add, remove,
          or reassign participants. Learners enrol through checkout, mentors are assigned per course, and both are
          further managed through their own workflows. This screen therefore shows only mentors and aggregate counts.
        </p>
      </div>
    </div>
  );
}
