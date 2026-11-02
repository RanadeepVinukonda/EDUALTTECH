import type { Metadata } from "next";
import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import HomeAuthRedirect from "@/components/layout/HomeAuthRedirect";
import Hero from "@/components/landing/Hero";
import TrustCredibility from "@/components/landing/TrustCredibility";
import Offerings from "@/components/landing/Offerings";
import CurriculumPreview from "@/components/landing/CurriculumPreview";
import Pathway from "@/components/landing/Pathway";
import HowItWorksSection from "@/components/landing/HowItWorksSection";

export const metadata: Metadata = {
  title: "EduAltTech — Practical Learning, Alternate Skills & Working Mentors",
  description:
    "EduAltTech teaches practical AI, technology, and alternate education like music and dance through structured courses with dedicated mentors and free open notes.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      <HomeAuthRedirect />

      {/* 2. Hero Section */}
      <Hero />

      {/* 3. Trust & Credibility: Impact Numbers, Partner Schools & Classrooms */}
      <TrustCredibility />

      {/* 4. Explore Learning Categories */}
      <Offerings />

      {/* 5. Featured Courses */}
      <CurriculumPreview />

      {/* 6. How It Works */}
      <Pathway />

      {/* 7. How Learning Works */}
      <HowItWorksSection />

      {/* 9. Final Call to Action */}
      <section className="bg-ink-900 py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:items-end lg:gap-14 lg:px-8">
          <div className="lg:col-span-8">
            <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl sm:leading-tight lg:text-5xl">
              Learn a skill worth paying for. Or teach one.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300">
              Structured courses with working mentors, free open notes, and a paid path for
              practitioners who want to teach what they know.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:col-span-4 lg:justify-end">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-ink-900 transition hover:bg-slate-100"
            >
              Explore courses
              <ArrowForward fontSize="small" />
            </Link>
            <Link
              href="/mentor"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Become a mentor
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}