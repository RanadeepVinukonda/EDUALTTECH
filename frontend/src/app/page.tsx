import type { Metadata } from "next";
import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import HomeAuthRedirect from "@/components/layout/HomeAuthRedirect";
import Hero from "@/components/landing/Hero";
import TrustCredibility from "@/components/landing/TrustCredibility";
import Offerings from "@/components/landing/Offerings";
import CurriculumPreview from "@/components/landing/CurriculumPreview";
import Pathway from "@/components/landing/Pathway";

export const metadata: Metadata = {
  title: "EduAltTech — Practical Learning, Alternate Skills & Working Mentors",
  description:
    "EduAltTech teaches practical AI, technology, and alternate education like music and dance through structured courses with dedicated mentors and free open notes.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper">
      <HomeAuthRedirect />

      <Hero />

      <TrustCredibility />

      <Offerings />

      <CurriculumPreview />

      <Pathway />

      <section className="bg-brand-900 py-14 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="font-display text-section font-semibold leading-tight text-white">
              Mentored courses. Paid teaching.
            </h2>
            <p className="max-w-md text-sm leading-relaxed text-brand-100/85">
              Start learning with working mentors, vote on upcoming cohorts, or teach a course you know well.
            </p>
          </div>
          <div className="mt-10 grid border-t border-white/20 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/courses"
              className="group flex min-h-28 flex-col justify-between gap-5 border-b border-white/20 py-5 text-white transition-colors hover:text-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:border-r sm:pr-6 lg:border-b-0"
            >
              <span className="font-display text-lg font-semibold">Courses</span>
              <span className="inline-flex items-center gap-2 text-sm text-brand-100 group-hover:text-white">
                Explore courses <ArrowForward fontSize="small" aria-hidden className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
            <Link
              href="/mentor"
              className="group flex min-h-28 flex-col justify-between gap-5 border-b border-white/20 py-5 text-white transition-colors hover:text-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:pl-6 lg:border-b-0 lg:border-r lg:px-6"
            >
              <span className="font-display text-lg font-semibold">Mentoring</span>
              <span className="inline-flex items-center gap-2 text-sm text-brand-100 group-hover:text-white">
                Apply to mentor <ArrowForward fontSize="small" aria-hidden className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
            <Link
              href="/resources"
              className="group flex min-h-28 flex-col justify-between gap-5 border-b border-white/20 py-5 text-white transition-colors hover:text-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:border-b-0 sm:border-r sm:pr-6 lg:px-6"
            >
              <span className="font-display text-lg font-semibold">Open resources</span>
              <span className="inline-flex items-center gap-2 text-sm text-brand-100 group-hover:text-white">
                Browse free lessons <ArrowForward fontSize="small" aria-hidden className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
            <Link
              href="/polls"
              className="group flex min-h-28 flex-col justify-between gap-5 py-5 text-white transition-colors hover:text-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:pl-6"
            >
              <span className="font-display text-lg font-semibold">Course polls</span>
              <span className="inline-flex items-center gap-2 text-sm text-brand-100 group-hover:text-white">
                Vote on next topics <ArrowForward fontSize="small" aria-hidden className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}