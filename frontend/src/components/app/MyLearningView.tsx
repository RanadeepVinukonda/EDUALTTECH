"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { MyCourses } from "@/lib/app-types";
import { cn } from "@/lib/cn";
import { buttonClass } from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import CourseCard from "@/components/landing/CourseCard";
import { meetingLabel } from "@/components/landing/CourseCardLive";

type Tab = "learning" | "mentoring";

const STATUS_LABEL: Record<string, string> = {
  PUBLISHED: "Published",
  DRAFT: "Draft",
  ARCHIVED: "Archived",
};

function statusLabel(status: string): string {
  return STATUS_LABEL[status] ?? status.replace(/_/g, " ").toLowerCase();
}

export default function MyLearningView() {
  const [data, setData] = useState<MyCourses | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("learning");

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await apiGet<MyCourses>("/courses/mine"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your courses.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return <Spinner label="Loading your courses…" />;

  const counts = { learning: data.learning.length, mentoring: data.mentoring.length };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink-900">My Learning</h1>
        <p className="mt-1 text-[15px] text-slate-500">Everything you&apos;re enrolled in or mentoring.</p>
      </header>

      <div role="tablist" aria-label="Course roles" className="flex gap-2">
        {(["learning", "mentoring"] as Tab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              tab === t ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700 hover:bg-slate-200",
            )}
          >
            {t === "learning" ? "Learning" : "Mentoring"} ({counts[t]})
          </button>
        ))}
      </div>

      {tab === "learning" ? (
        data.learning.length === 0 ? (
          <EmptyState
            title="Not enrolled in any course yet"
            description="Browse the catalogue and start with a free course."
            action={
              <Link href="/courses" className={buttonClass("primary", "sm")}>
                Browse courses
              </Link>
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {data.learning.map((row) => (
              <CourseCard
                key={row.id}
                course={row.course}
                href={`/dashboard/courses/${row.course.slug}`}
                badge={statusLabel(row.course.status)}
                priceLabel="Enrolled"
                progressPct={row.progressPct}
                mentor={row.mentor ? `${row.mentor.firstName} ${row.mentor.lastName}` : undefined}
                viewLabel={row.progressPct > 0 ? "Continue" : "Start learning"}
              />
            ))}
          </div>
        )
      ) : data.mentoring.length === 0 ? (
        <EmptyState title="You're not mentoring any course" description="Once you're accepted as a mentor, your courses appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {data.mentoring.map((row) => (
            <CourseCard
              key={row.id}
              course={row.course}
              href={`/dashboard/mentor/courses/${row.course.slug}`}
              badge={statusLabel(row.course.status)}
              priceLabel="Mentoring"
              viewLabel="Open teaching workspace"
              stats={[
                { label: "Students", value: String(row.course._count?.participants ?? 0) },
                { label: "Lessons live", value: `${row.lessonsPublished ?? 0}/${row.lessonsTotal ?? 0}` },
                {
                  label: "Next meeting",
                  value: row.nextMeetingAt ? meetingLabel(row.nextMeetingAt) : "Not scheduled",
                },
              ]}
            />
          ))}
        </div>
      )}
    </div>
  );
}
