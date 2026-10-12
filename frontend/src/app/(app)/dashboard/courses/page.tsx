import { Suspense } from "react";
import type { Metadata } from "next";
import CourseBrowser from "@/components/courses/CourseBrowser";

export const metadata: Metadata = { title: "Courses" };

export default function LearnerCoursesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-ink-900">Courses</h1>
        <p className="mt-1 text-sm text-slate-500">Browse the catalogue and enroll to start learning.</p>
      </header>
      <Suspense fallback={null}>
        <CourseBrowser basePath="/dashboard/courses" />
      </Suspense>
    </div>
  );
}