import Link from "next/link";
import type { Metadata } from "next";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { publicFetch } from "@/lib/server-api";
import type { CourseListItem } from "@/lib/types";
import Hero from "@/components/landing/Hero";
import HomeAuthRedirect from "@/components/layout/HomeAuthRedirect";
import PartnerStrip from "@/components/landing/PartnerStrip";
import Offerings from "@/components/landing/Offerings";
import PhotoBand from "@/components/landing/PhotoBand";
import Pathway from "@/components/landing/Pathway";
import SectionHeading from "@/components/landing/SectionHeading";
import CourseCardLive from "@/components/landing/CourseCardLive";
import DataUnavailable from "@/components/landing/DataUnavailable";
import LinkButton from "@/components/ui/LinkButton";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export const metadata: Metadata = {
  title: "Edu Alt Tech (EduAltTech) — practical AI, entrepreneurship and technology courses",
  description:
    "Edu Alt Tech (EduAltTech) teaches practical AI, entrepreneurship, and technology through structured courses, alternate learning, and tuition — taught by skilled mentors we employ.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const courses = await publicFetch<{ items: CourseListItem[] }>("/courses", { limit: 6, sort: "newest" });
  const courseItems = courses?.items ?? [];
  const coursesFailed = courses === null;

  return (
    <>
      <HomeAuthRedirect />
      <Hero />
      <PartnerStrip scroll />
      <Offerings />
      <PhotoBand />

      {/* Course discovery preview */}
      <section className="bg-white py-16 sm:py-20">
        <div className={wrap}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Courses"
              title="Start with something you can build"
            />
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              View all courses
              <ArrowForward fontSize="small" />
            </Link>
          </div>

          {coursesFailed ? (
            <div className="mt-12">
              <DataUnavailable label="the course catalogue" />
            </div>
          ) : courseItems.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courseItems.map((c) => (
                <CourseCardLive key={c.id} course={c} />
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center sm:p-12">
              <h3 className="font-display text-xl font-bold text-ink-900">Courses are being published</h3>
              <p className="mx-auto mt-3 max-w-md text-ink-600">
                Our catalogue is being prepared. Check back soon for courses to start learning.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <LinkButton href="/courses">Open the catalogue</LinkButton>
                <LinkButton href="/contact" variant="secondary">
                  Contact us
                </LinkButton>
              </div>
            </div>
          )}
        </div>
      </section>

      <Pathway />

      {/* Final call to action */}
      <section className="bg-brand-700 py-16 sm:py-20">
        <div className={`${wrap} text-center`}>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold text-white text-balance sm:text-4xl">
            Learn with us, or teach and earn with us
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-50">
            Whether you are a student ready to build or a skilled person looking for work, there is a
            clear next step.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/courses" variant="secondary" size="lg">
              Explore courses
            </LinkButton>
            <Link
              href="/mentor"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Teach with us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}