import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import CourseBrowser from "@/components/courses/CourseBrowser";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Browse published EduAltTech courses in AI, entrepreneurship, and technology — structured roadmaps with mentors, taught for practical outcomes.",
  alternates: { canonical: "/courses" },
};

export default function CoursesPage() {
  return (
    <div className="bg-white">
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-sm text-ink-600">
              <li>
                <Link href="/" className="hover:text-ink-900">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-slate-400">
                <ChevronRight fontSize="small" />
              </li>
              <li className="font-medium text-ink-900" aria-current="page">
                Courses
              </li>
            </ol>
          </nav>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
            Explore our courses
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-600">
            Practical, roadmap-structured programs in AI, entrepreneurship, and applied technology.
            Every course is built around doing — with mentors on hand to guide you through it.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-slate-200">
                  <div className="aspect-[16/10] w-full animate-pulse bg-slate-200" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
                    <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <CourseBrowser />
        </Suspense>
      </div>
    </div>
  );
}
