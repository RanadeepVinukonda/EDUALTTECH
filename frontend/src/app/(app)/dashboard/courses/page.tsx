import { Suspense } from "react";
import type { Metadata } from "next";
import CourseBrowser from "@/components/courses/CourseBrowser";
import Skeleton from "@/components/ui/Skeleton";

export const metadata: Metadata = { title: "Courses" };

export default function LearnerCoursesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink-900">Courses</h1>
        <p className="mt-1 text-sm text-slate-500">Browse the catalogue and enroll to start learning.</p>
      </header>
      <Suspense
        fallback={
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-200">
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