import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import Lightbulb from "@mui/icons-material/Lightbulb";
import Build from "@mui/icons-material/Build";
import Storefront from "@mui/icons-material/Storefront";
import Flag from "@mui/icons-material/Flag";
import { publicFetch } from "@/lib/server-api";
import type { ProgramItem, WorkItem } from "@/lib/types";
import SectionHeading from "@/components/landing/SectionHeading";
import WorkCard from "@/components/landing/WorkCard";
import LinkButton from "@/components/ui/LinkButton";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export const metadata: Metadata = {
  title: "About",
  description:
    "EduAltTech helps learners build practical AI, entrepreneurship, and technology skills — and builds working digital solutions for schools. A product by Setsuzoku.",
  alternates: { canonical: "/about" },
};

const APPROACH = [
  {
    icon: Build,
    title: "Learn by building",
    body: "Skills are formed by making things, not by reading about them. Every course is organised around practical work you carry out yourself.",
  },
  {
    icon: Lightbulb,
    title: "Understand the problem first",
    body: "Before choosing a tool, we teach learners to understand the real problem in front of them — the same discipline we apply to our own projects.",
  },
  {
    icon: Storefront,
    title: "Connect technology with entrepreneurship",
    body: "Building something useful and making it sustainable are different skills. We treat both as part of the same capability.",
  },
  {
    icon: Flag,
    title: "Aim beyond theory",
    body: "The goal is a working outcome — a prototype, a small venture, or a tool that solves a problem around you.",
  },
];

export default async function AboutPage() {
  const [programs, work] = await Promise.all([
    publicFetch<{ items: ProgramItem[] }>("/cms/public/programs"),
    publicFetch<{ items: WorkItem[] }>("/cms/public/work", { limit: 3 }),
  ]);

  const programItems = programs?.items ?? [];
  const workItems = work?.items ?? [];

  return (
    <div className="bg-white">
      {/* Intro */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className={`${wrap} py-10 sm:py-14`}>
          <nav aria-label="Breadcrumb" className="mb-6">
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
                About
              </li>
            </ol>
          </nav>
          <SectionHeading
            as="h1"
            eyebrow="About EduAltTech"
            title="Practical learning, and the technology to support it"
            lead="EduAltTech does two connected things. We help learners develop practical skills in AI, entrepreneurship, and technology beyond the regular curriculum — and we build useful software for the schools that teach them."
          />
        </div>
      </section>

      {/* Mission and philosophy */}
      <section className="py-16 sm:py-20">
        <div className={wrap}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <h2 className="font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Why practical learning
            </h2>
            <div className="max-w-prose space-y-5 text-lg leading-relaxed text-ink-700">
              <p>
                The skills that matter most — building software, solving a real problem, turning an idea
                into something people can use — are learned by doing. A syllabus alone rarely produces
                them.
              </p>
              <p>
                EduAltTech exists to close that gap. We build structured courses where learners work
                through real, practical tasks with mentors, and we keep the focus on outcomes rather than
                theory.
              </p>
              <p>
                The same belief shapes our work with schools: understand the problem, then build something
                that actually helps.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Approach */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className={wrap}>
          <SectionHeading
            eyebrow="Our approach"
            title="Four ideas we work from"
            lead="These principles guide both how we teach and what we build."
          />
          <div className="mt-12 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {APPROACH.map((item, i) => (
              <div key={item.title} className="grid gap-4 p-6 sm:grid-cols-[auto_1fr] sm:gap-8 sm:p-8">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-sm text-slate-400">{String(i + 1).padStart(2, "0")}</span>
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <item.icon />
                  </span>
                </div>
                <div className="max-w-2xl">
                  <h3 className="font-display text-xl font-bold text-ink-900">{item.title}</h3>
                  <p className="mt-2 leading-relaxed text-ink-600">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* School technology */}
      <section className="py-16 sm:py-20">
        <div className={wrap}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <SectionHeading
              eyebrow="Technology for schools"
              title="Software built with schools, not just for them"
              lead="We design and build digital solutions that reduce administrative load and support teaching — starting from a concrete problem a school is facing."
            />
            <div className="max-w-prose space-y-5 text-lg leading-relaxed text-ink-700">
              <p>
                Each engagement begins with understanding how a school actually works, then building the
                smallest thing that genuinely helps. We do not claim a solution is deployed unless the
                record shows it.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <LinkButton href="/services">Services & programs</LinkButton>
                <LinkButton href="/work" variant="secondary">
                  See our work
                </LinkButton>
              </div>
            </div>
          </div>

          {workItems.length > 0 && (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {workItems.map((w) => (
                <WorkCard key={w.id} item={w} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Programs and community */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className={wrap}>
          <SectionHeading
            eyebrow="Programs and community"
            title="What we run"
            lead="Educational programs and initiatives we deliver with schools and learners."
          />
          {programItems.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {programItems.map((p) => (
                <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <h3 className="font-display text-lg font-bold text-ink-900">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">{p.summary}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-12 max-w-3xl rounded-2xl border border-slate-200 bg-white p-8">
              <p className="text-lg leading-relaxed text-ink-700">
                Our programs connect a technical skill to a real outcome. Details of current and upcoming
                programs are published as they are confirmed.
              </p>
              <Link
                href="/services"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Explore services and programs
                <ChevronRight fontSize="small" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Setsuzoku */}
      <section className="py-16 sm:py-20">
        <div className={wrap}>
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-ink-900 p-8 text-slate-200 sm:p-12">
            <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-12">
              <div className="flex h-20 w-56 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/media/brand/logo.png" alt="EduAltTech" width={432} height={436} className="h-10 w-auto brightness-0 invert" />
              </div>
              <div className="max-w-2xl">
                <h2 className="font-display text-2xl font-bold text-white">Part of Setsuzoku</h2>
                <p className="mt-4 leading-relaxed text-slate-300">
                  EduAltTech is a product under Setsuzoku. Where our educational courses and our work with
                  schools meet, they share one goal: helping people turn practical skills into something
                  useful.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing action */}
      <section className="border-t border-slate-200 bg-slate-50 py-16 sm:py-20">
        <div className={`${wrap} text-center`}>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold text-ink-900 sm:text-4xl">
            Where would you like to start?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-600">
            Learn something practical, see technology we have built, or talk to us about your school.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/courses" size="lg">
              Explore courses
            </LinkButton>
            <LinkButton href="/services" variant="secondary" size="lg">
              Services & programs
            </LinkButton>
            <LinkButton href="/contact" variant="secondary" size="lg">
              Contact us
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
