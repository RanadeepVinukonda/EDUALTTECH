import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ArrowForward from "@mui/icons-material/ArrowForward";
import CheckCircle from "@mui/icons-material/CheckCircle";
import HowToVote from "@mui/icons-material/HowToVote";
import WorkspacePremium from "@mui/icons-material/WorkspacePremium";
import CourseBrowser from "@/components/courses/CourseBrowser";

export const metadata: Metadata = {
  title: "Courses",
  description:
    "Browse published EduAltTech courses in AI, entrepreneurship, and technology - structured roadmaps with mentors, taught for practical outcomes.",
  alternates: { canonical: "/courses" },
};

const PASS_PERKS = [
  "Mentor-guided practical roadmaps",
  "Project feedback & live doubt sessions",
  "Verified completion certificates",
];

export default function CoursesPage() {
  return (
    <div className="bg-paper">
      {/* Creative Catalog Header */}
      <section
        className="relative overflow-hidden border-b border-rule bg-paper-2"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15, 32, 39, 0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(3,140,62,0.1),transparent_55%)]"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-sm text-muted">
              <li>
                <Link href="/" className="transition-colors hover:text-ink">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-muted/70">
                <ChevronRight fontSize="small" />
              </li>
              <li className="font-medium text-ink" aria-current="page">
                Courses
              </li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.14em] text-brand-700">
                Course Catalog · Mentor-Led
              </p>
              <h1 className="mt-2.5 max-w-2xl font-display text-display-s font-semibold leading-[1.06] tracking-tight text-ink">
                Explore our courses.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
                Practical, roadmap-structured programs in AI, entrepreneurship, software engineering, and creative arts — built around doing, with mentors guiding every step.
              </p>
            </div>

            {/* Learning Guarantee Card */}
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-rule bg-[#ffffff] shadow-elev2">
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rule bg-paper text-brand-700 shadow-sm sm:h-14 sm:w-14">
                      <WorkspacePremium sx={{ fontSize: 28 }} className="text-brand-600" aria-hidden />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-mono font-semibold uppercase tracking-[0.12em] text-brand-700">
                        Learning Standard
                      </p>
                      <p className="font-display text-base font-semibold text-ink sm:text-lg">
                        Every Course Includes
                      </p>
                    </div>
                  </div>

                  <ul className="mt-4 space-y-2.5 border-t border-rule pt-4 text-xs font-medium text-ink-2 sm:text-sm">
                    {PASS_PERKS.map((perk) => (
                      <li key={perk} className="flex items-center gap-2">
                        <CheckCircle sx={{ fontSize: 16 }} className="shrink-0 text-brand-600" aria-hidden />
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Catalog Browser */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Suspense
          fallback={
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-rule bg-[#ffffff] shadow-elev1">
                  <div className="aspect-[16/10] w-full animate-pulse bg-paper-2" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-1/3 animate-pulse rounded bg-paper-2" />
                    <div className="h-5 w-2/3 animate-pulse rounded bg-paper-2" />
                    <div className="h-4 w-full animate-pulse rounded bg-paper-2" />
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <CourseBrowser />
        </Suspense>

        {/* Community Demand Footer Callout */}
        <section className="mt-14 overflow-hidden rounded-3xl bg-brand-900 p-6 text-white shadow-elev2 sm:p-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-wider text-brand-100">
                <HowToVote sx={{ fontSize: 14 }} aria-hidden />
                <span>Learner-Driven Roadmap</span>
              </div>
              <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Don&apos;t see the topic you want to learn?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-100/85 sm:text-base">
                Vote on upcoming course proposals in our community polls — top-voted topics are built into full mentor-led courses.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <Link
                href="/polls"
                className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#ffffff] px-5 text-sm font-semibold text-brand-900 shadow-sm transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Vote on next courses
                <ArrowForward sx={{ fontSize: 16 }} aria-hidden />
              </Link>
              <Link
                href="/resources"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Browse free resources
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
