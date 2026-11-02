import type { Metadata } from "next";
import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import CoverImage from "@/components/ui/CoverImage";
import LinkButton from "@/components/ui/LinkButton";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { initialsFromName } from "@/lib/name";
import { TEAM } from "@/lib/team";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export const metadata: Metadata = {
  title: "About",
  description:
    "EduAltTech helps learners build practical AI, entrepreneurship, and technology skills. A product by Setsuzoku.",
  alternates: { canonical: "/about" },
};

const COMMITMENTS = [
  {
    title: "Education and alternate education",
    body: "Students get structured courses and, where the standard path does not fit, alternate learning routes to the same practical outcomes.",
  },
  {
    title: "Tuition facilities",
    body: "Guided tuition and coaching alongside our courses: subject support, doubt sessions, and hands-on practice, in person and online.",
  },
  {
    title: "Employment for skilled people",
    body: "We recruit skilled people who are out of work, train them as mentors and tutors, and pay them to teach.",
  },
];

const APPROACH = [
  {
    title: "Learn by building",
    body: "Skills are formed by making things, not by reading about them. Every course is organised around practical work you carry out yourself.",
  },
  {
    title: "Understand the problem first",
    body: "Before choosing a tool, we teach learners to understand the real problem in front of them. It is the same discipline we apply to our own projects.",
  },
  {
    title: "Connect technology with entrepreneurship",
    body: "Building something useful and making it sustainable are different skills. We treat both as part of the same capability.",
  },
  {
    title: "Aim beyond theory",
    body: "The goal is a working outcome: a prototype, a small venture, or a tool that solves a problem around you.",
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Intro */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className={`${wrap} py-10 sm:py-14`}>
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-1.5 text-sm text-ink-600">
              <li>
                <Link href="/" className="transition-colors hover:text-ink-900">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-slate-400">
                <ChevronRight fontSize="small" />
              </li>
              <li className="font-medium text-ink-900" aria-current="page">
                About
              </li>
            </ol>
          </nav>

          <h1 className="max-w-4xl font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl sm:leading-[1.06]">
            Practical learning, and work for the people who teach it.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-600 sm:text-lg">
            Students learn skills in AI, entrepreneurship, and technology. The mentors who teach them are
            skilled professionals we train and employ.
          </p>

          <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-200 pt-6 text-xs font-semibold text-slate-600">
            <li>Courses</li>
            <li aria-hidden className="h-1 w-1 rounded-full bg-slate-300" />
            <li>Alternate education</li>
            <li aria-hidden className="h-1 w-1 rounded-full bg-slate-300" />
            <li>Tuition</li>
            <li aria-hidden className="h-1 w-1 rounded-full bg-slate-300" />
            <li>Paid mentoring</li>
          </ul>
        </div>
      </section>

      {/* Why practical learning */}
      <section className="border-b border-slate-200 bg-white py-16 sm:py-24">
        <div className={`${wrap} grid items-center gap-10 lg:grid-cols-12 lg:gap-16`}>
          <figure className="lg:col-span-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/photos/EAT4.jpg"
              alt="Students working with a mentor during a classroom session"
              className="aspect-[4/3] w-full rounded-xl object-cover"
              loading="lazy"
            />
            <figcaption className="mt-3 text-xs text-slate-500">
              Classroom session, Kakinada
            </figcaption>
          </figure>

          <div className="lg:col-span-7">
            <h2 className="max-w-lg font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              Practical learning, not syllabus completion.
            </h2>
            <div className="mt-5 max-w-prose space-y-5 text-base leading-relaxed text-ink-600 sm:text-lg">
              <p>
                The skills that matter most are learned by doing: building software, solving a real
                problem, turning an idea into something people can use. A syllabus alone rarely produces
                them.
              </p>
              <p>
                EduAltTech exists to close that gap. We build structured courses where learners work
                through real tasks with mentors, and we keep the focus on outcomes rather than theory.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Commitments */}
      <section className="border-b border-slate-200 bg-white py-16 sm:py-24">
        <div className={wrap}>
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Learning and livelihood, together.
          </h2>
          <p className="mt-3 max-w-md text-base leading-relaxed text-ink-600">
            Three commitments sit behind everything we run. Each one has to be real to count.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            {COMMITMENTS.map((c) => (
              <div key={c.title} className="rounded-xl border border-slate-200 bg-slate-50/50 p-6">
                <h3 className="font-display text-base font-semibold text-ink-900">{c.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-600">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="border-b border-slate-200 bg-slate-50 py-16 sm:py-24">
        <div className={wrap}>
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Four ideas we work from.
          </h2>
          <p className="mt-3 max-w-md text-base leading-relaxed text-ink-600">
            These principles guide both how we teach and what we build.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {APPROACH.map((item, i) => (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-6">
                <span className="font-mono text-xs text-slate-400">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="border-b border-slate-200 bg-white py-16 sm:py-24">
        <div className={wrap}>
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            The people behind EduAltTech.
          </h2>
          <p className="mt-3 max-w-md text-base leading-relaxed text-ink-600">
            The educators, builders, and mentors who make our courses work.
          </p>

          <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {TEAM.map((m) => (
              <li key={m.name} className="group">
                <div className="mb-4 h-32 w-32 overflow-hidden rounded-xl border border-slate-200 sm:h-36 sm:w-36">
                  <CoverImage src={m.image} alt={`Portrait of ${m.name}`} fallback={initialsFromName(m.name)} />
                </div>
                <h3 className="font-display text-base font-semibold capitalize text-ink-900">{m.name}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {m.title}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Setsuzoku */}
      <section className="border-b border-slate-200 bg-white py-16 sm:py-24">
        <div className={wrap}>
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            A product by Setsuzoku.
          </h2>
          <p className="mt-3 max-w-prose text-base leading-relaxed text-ink-600 sm:text-lg">
            Setsuzoku is the parent company behind EduAltTech. Everything here, from the courses to the
            programs we run, comes from the same team.
          </p>
          <Link
            href="https://setsuzoku.in"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4 transition hover:text-brand-800"
          >
            Visit setsuzoku.in
            <ArrowForward fontSize="small" />
          </Link>
        </div>
      </section>

      {/* Closing */}
      <section className="bg-white py-16 sm:py-24">
        <div className={wrap}>
          <h2 className="max-w-xl font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Where would you like to start?
          </h2>
          <p className="mt-3 max-w-md text-base text-ink-600">
            Learn something practical, or talk to us about your school.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/courses">Explore courses</LinkButton>
            <LinkButton href="/contact" variant="secondary">
              Contact us
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
