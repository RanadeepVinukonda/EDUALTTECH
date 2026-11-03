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

      <section className="border-t border-rule bg-paper-2 py-12 sm:py-16">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-5">
            <h2 className="max-w-md font-display text-section font-semibold tracking-tight text-ink leading-tight">
              Beyond the course
            </h2>
          </div>
          <nav aria-label="More ways to learn" className="lg:col-span-7">
            <ul className="divide-y divide-rule border-y border-rule">
              <li>
                <Link
                  href="/resources"
                  className="flex min-h-16 items-center justify-between gap-4 py-4 font-medium text-ink transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  Free resources
                  <ArrowForward fontSize="small" aria-hidden />
                </Link>
              </li>
              <li>
                <Link
                  href="/polls"
                  className="flex min-h-16 items-center justify-between gap-4 py-4 font-medium text-ink transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  Course polls
                  <ArrowForward fontSize="small" aria-hidden />
                </Link>
              </li>
              <li>
                <Link
                  href="/mentor"
                  className="flex min-h-16 items-center justify-between gap-4 py-4 font-medium text-ink transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  Mentoring
                  <ArrowForward fontSize="small" aria-hidden />
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </section>

      <section className="bg-brand-900 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-section font-semibold leading-tight text-white">
            Mentored courses. Paid teaching.
          </h2>
          <div className="mt-10 grid border-t border-white/25 sm:grid-cols-3">
            <Link
              href="/courses"
              className="flex min-h-28 flex-col justify-between gap-5 border-b border-white/25 py-5 text-white transition-colors hover:text-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:border-b-0 sm:border-r sm:pr-6"
            >
              <span className="font-display text-lg font-semibold">Courses</span>
              <span className="inline-flex items-center gap-2 text-sm">Explore courses <ArrowForward fontSize="small" aria-hidden /></span>
            </Link>
            <Link
              href="/mentor"
              className="flex min-h-28 flex-col justify-between gap-5 border-b border-white/25 py-5 text-white transition-colors hover:text-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:border-b-0 sm:border-r sm:px-6"
            >
              <span className="font-display text-lg font-semibold">Mentoring</span>
              <span className="inline-flex items-center gap-2 text-sm">Explore mentoring <ArrowForward fontSize="small" aria-hidden /></span>
            </Link>
            <Link
              href="/resources"
              className="flex min-h-28 flex-col justify-between gap-5 border-b border-white/25 py-5 text-white transition-colors hover:text-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:border-b-0 sm:pl-6"
            >
              <span className="font-display text-lg font-semibold">Open resources</span>
              <span className="inline-flex items-center gap-2 text-sm">Browse free lessons <ArrowForward fontSize="small" aria-hidden /></span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}