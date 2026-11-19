import type { Metadata } from "next";
import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Explore from "@mui/icons-material/Explore";
import LibraryBooks from "@mui/icons-material/LibraryBooks";
import Handshake from "@mui/icons-material/Handshake";
import Terminal from "@mui/icons-material/Terminal";
import Lightbulb from "@mui/icons-material/Lightbulb";
import WorkspacePremium from "@mui/icons-material/WorkspacePremium";
import Psychology from "@mui/icons-material/Psychology";
import TeamShowcase from "@/components/landing/TeamShowcase";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export const metadata: Metadata = {
  title: "About",
  description:
    "EduAltTech helps learners build practical AI, entrepreneurship, and technology skills. A product by Setsuzoku.",
  alternates: { canonical: "/about" },
};

const HERO_PILLARS = ["Courses", "Alternate education", "Tuition", "Paid mentoring"];

const COMMITMENTS = [
  {
    title: "Education and alternate education",
    body: "Structured courses and alternate learning routes to the same practical outcomes when standard paths don't fit.",
    Icon: Explore,
  },
  {
    title: "Tuition facilities",
    body: "Guided tuition and coaching alongside courses: subject support, doubt sessions, and hands-on practice online and in person.",
    Icon: LibraryBooks,
  },
  {
    title: "Employment for skilled people",
    body: "We recruit skilled practitioners, train them as mentors and tutors, and pay them to teach.",
    Icon: Handshake,
  },
];

const APPROACH = [
  {
    title: "Learn by building",
    body: "Skills are formed by making things, not just reading. Every course centers on practical work you carry out yourself.",
    Icon: Terminal,
  },
  {
    title: "Understand the problem first",
    body: "Before choosing a tool, learners study the real problem in front of them — the same discipline we apply to our own projects.",
    Icon: Lightbulb,
  },
  {
    title: "Connect tech & entrepreneurship",
    body: "Building something useful and making it sustainable are different skills. We treat both as one capability.",
    Icon: WorkspacePremium,
  },
  {
    title: "Aim beyond theory",
    body: "The goal is a working outcome: a prototype, a small venture, or a tool that solves a real problem around you.",
    Icon: Psychology,
  },
];

export default function AboutPage() {
  return (
    <div className="bg-paper">
      {/* Compact Full-Width Solid Brand-Green Split Hero with Classroom Photo */}
      <section className="border-b border-[#02481f] bg-[#025926] text-white">
        <div className={`${wrap} py-10 sm:py-12`}>
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex items-center gap-1.5 text-sm text-white/80">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-white/55">
                <ChevronRight fontSize="small" />
              </li>
              <li className="font-medium text-white" aria-current="page">
                About
              </li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-10">
            <div className="lg:col-span-7">
              <h1 className="max-w-2xl font-display text-display-s font-semibold leading-[1.06] tracking-tight text-white">
                Practical skills and paid teaching.
              </h1>
              <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
                Learners build practical skills in AI, engineering, and creative arts — while skilled practitioners earn by mentoring and teaching.
              </p>

              <ul className="mt-5 flex flex-wrap items-center gap-2">
                {HERO_PILLARS.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-white/25 bg-white/15 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/courses"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#ffffff] px-5 text-sm font-semibold text-[#025926] shadow-sm transition hover:bg-brand-50"
                >
                  Explore courses
                  <ArrowForward sx={{ fontSize: 16 }} aria-hidden />
                </Link>
                <Link
                  href="/mentor"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/30 bg-white/15 px-5 text-sm font-semibold text-white transition hover:bg-white/25"
                >
                  Become a mentor
                </Link>
              </div>
            </div>

            <figure className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl bg-brand-800 shadow-elev3 ring-2 ring-white/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/media/photos/EAT4.jpg"
                  alt="Students working with a mentor during a classroom session in Kakinada"
                  className="aspect-[16/10] w-full object-cover"
                />
              </div>
              <figcaption className="mt-2.5 flex items-center justify-between text-xs font-medium text-white/80">
                <span>Classroom session, Kakinada</span>
                <span>Partner school program</span>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      {/* Combined Purpose + Three Commitments Bento (zero wasted vertical space) */}
      <section className="border-b border-rule bg-paper py-10 sm:py-12">
        <div className={`${wrap} grid gap-6 lg:grid-cols-12 lg:items-stretch`}>
          {/* Left: Our Purpose Story Card */}
          <div className="flex flex-col justify-between rounded-2xl border border-rule bg-[#ffffff] p-6 shadow-elev1 sm:p-8 lg:col-span-5">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                Our Purpose
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Practical learning, not syllabus completion.
              </h2>
              <div className="mt-4 space-y-3.5 text-sm leading-relaxed text-ink-2 sm:text-base">
                <p>
                  The skills that matter most are learned by doing: building software, solving a real
                  problem, turning an idea into something people can use. A syllabus alone rarely produces
                  them.
                </p>
                <p>
                  EduAltTech exists to close that gap. We build structured courses where learners work
                  through real tasks with mentors, keeping the focus on real outcomes rather than rote theory.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-rule pt-4 text-xs font-semibold text-[#025926]">
              <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1">
                Hands-on tasks
              </span>
              <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1">
                Working mentors
              </span>
              <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1">
                Real outcomes
              </span>
            </div>
          </div>

          {/* Right: Three Commitments Stacked Bento */}
          <div className="flex flex-col justify-between gap-4 lg:col-span-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2 px-1">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                  Our Commitments
                </p>
                <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink">
                  Learning and livelihood, together.
                </h2>
              </div>
              <p className="text-xs text-muted">
                Three commitments behind everything we run.
              </p>
            </div>

            <div className="grid flex-1 gap-4">
              {COMMITMENTS.map(({ title, body, Icon }, i) => (
                <div
                  key={title}
                  className="flex items-start gap-4 rounded-2xl border border-rule bg-[#ffffff] p-5 shadow-elev1 transition-all duration-200 hover:border-brand-300 hover:shadow-elev2"
                >
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-[#025926]">
                    <Icon fontSize="small" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-base font-semibold text-ink">{title}</h3>
                      <span className="font-mono text-xs font-semibold text-muted">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-ink-2">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Four Principles — Compact 4-Column Row */}
      <section className="border-b border-rule bg-paper-2 py-10 sm:py-12">
        <div className={wrap}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                How We Teach
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Four ideas we work from.
              </h2>
            </div>
            <p className="max-w-md text-sm text-ink-2">
              These principles guide both how we design courses and how we run classrooms.
            </p>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {APPROACH.map(({ title, body, Icon }, i) => (
              <div
                key={title}
                className="flex flex-col rounded-2xl border border-rule bg-[#ffffff] p-5 shadow-elev1 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-elev2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#025926] text-white">
                    <Icon fontSize="small" aria-hidden />
                  </span>
                  <span className="font-mono text-xs font-bold text-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-base font-semibold text-ink">{title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink-2 sm:text-sm">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Studio Wall */}
      <section className="border-b border-rule bg-paper py-10 sm:py-12">
        <div className={wrap}>
          <TeamShowcase />
        </div>
      </section>

      {/* Unified Side-by-Side Closing Band: Setsuzoku + Get Started */}
      <section className="bg-paper-2 py-10 sm:py-12">
        <div className={`${wrap} grid gap-6 lg:grid-cols-12`}>
          <div className="flex flex-col justify-between rounded-3xl border border-rule bg-[#ffffff] p-6 shadow-elev1 sm:p-8 lg:col-span-5">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                Parent Company
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink">
                A product by Setsuzoku.
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-ink-2">
                Setsuzoku is the parent company behind EduAltTech. Everything here - from our courses to the partner school programs we run - comes from the same team.
              </p>
            </div>
            <div className="mt-5 border-t border-rule pt-4">
              <Link
                href="https://setsuzoku.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-[#025926] underline decoration-brand-300 underline-offset-4 transition hover:text-brand-800"
              >
                Visit setsuzoku.in
                <ArrowForward fontSize="small" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-3xl bg-[#024059] p-6 text-white shadow-elev2 sm:p-8 lg:col-span-7">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-brand-300">
                Get Started
              </p>
              <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white">
                Where would you like to start?
              </h2>
              <p className="mt-2.5 max-w-xl text-sm leading-relaxed text-white/85">
                Explore mentor-led courses, read free tutorials, apply to teach a course you know well, or talk to us about running a program at your school.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#038c3e] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#026b2f]"
              >
                Explore courses
                <ArrowForward sx={{ fontSize: 16 }} aria-hidden />
              </Link>
              <Link
                href="/mentor"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Become a mentor
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
