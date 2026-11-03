import { Suspense } from "react";
import type { Metadata } from "next";
import CourseBrowser from "@/components/courses/CourseBrowser";
import Skeleton from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Courses" };

export default function LearnerCoursesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="border-b border-rule pb-5">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Courses</h1>
        <p className="mt-2 text-sm text-muted">Browse the catalogue and enroll to start learning.</p>
      </header>
      <Suspense
        fallback={
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-xl border border-slate-200">
                <Skeleton className="aspect-[16/10] w-full rounded-none" />
                <div className="space-y-3 p-5">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <CourseBrowser basePath="/dashboard/courses" />
      </Suspense>
    </div>
  );
}