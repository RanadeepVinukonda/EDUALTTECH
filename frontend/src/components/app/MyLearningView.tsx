"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { MyCourses } from "@/lib/app-types";
import { buttonClass } from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import CourseCard from "@/components/landing/CourseCard";

export default function MyLearningView() {
  const [data, setData] = useState<MyCourses | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink-900">My Learning</h1>
        <p className="mt-1 text-[15px] text-slate-500">Everything you&apos;re enrolled in.</p>
      </header>

      {data.learning.length === 0 ? (
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {data.learning.map((row) => (
            <CourseCard
              key={row.id}
              course={row.course}
              href={`/dashboard/courses/${row.course.slug}`}
              priceLabel="Enrolled"
              progressPct={row.progressPct}
              mentor={row.mentor ? `${row.mentor.firstName} ${row.mentor.lastName}` : undefined}
              viewLabel={row.progressPct > 0 ? "Continue" : "Start learning"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
