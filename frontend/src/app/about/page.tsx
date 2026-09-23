import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import TeamGrid from "@/components/team/TeamGrid";

export const metadata: Metadata = {
  title: "About",
  description:
    "Edu-Alt-Tech matches skilled people with students who need them — hands-on skill assessment, mentor training, and paid teaching. Schools get digital solutions and classroom programs in Kakinada, Andhra Pradesh.",
  alternates: { canonical: "https://www.edualttech.com/about" },
};

const PILLARS = [
  {
    icon: Sparkles,
    title: "Skill over paper",
    body: "A hands-on test decides whether you teach — not a degree or a CV. What you can actually do counts.",
  },
  {
    icon: HeartHandshake,
    title: "Mentors, not lecturers",
    body: "Students learn from people who do the work daily. Real projects, real problems, real context.",
  },
  {
    icon: ShieldCheck,
    title: "Built with schools",
    body: "Digital classrooms, ERP and AI tools built together with partner schools — tested by the people who use them.",
  },
];

const VALUES = [
  "Every teacher is tested on skill before they stand in front of a class",
  "Every story is local — Kakinada first, Andhra Pradesh next",
  "Schools pay only for what moves their real numbers",
  "Providers are paid per class, rated honestly, free to grow",
];

export default function AboutPage() {
  return (
    <div className="overflow-hidden bg-white">
      {/* Hero */}
      <section className="relative px-6 pb-20 pt-16">
        <div className="relative mx-auto max-w-7xl">
          <div className="max-w-3xl space-y-6">
            <h1 className="font-display text-5xl font-black leading-[0.95] tracking-tighter text-ink-700 md:text-6xl lg:text-7xl">
              Skills meet students.
              <br />
              <span className="text-brand-600">Anyone can be a mentor.</span>
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-slate-600 md:text-xl">
              Edu-Alt-Tech is a skill marketplace: people who know how to do something well get
              trained to teach it, and students who want to learn get matched to them. We started
              in Kakinada because the skilled people and the students were both already there — they
              just had no bridge. We built the bridge.
            </p>
            <p className="max-w-2xl text-lg leading-relaxed text-slate-600">
              For schools, we build the digital layer too — websites, ERP, admissions marketing and
              classroom programs — always together with the school, never just sold to it. We&apos;re
              part of the <strong className="font-semibold text-ink-700">Setsuzoku group</strong>,
              which also runs digital solutions and marketing services.
            </p>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-2xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-600">
              What we believe
            </div>
            <h2 className="font-display text-3xl font-black tracking-tight text-ink-700 md:text-4xl">
              Three rules behind everything we build.
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {PILLARS.map((p) => (
              <div
                key={p.title}
                className="group rounded-xl border border-black/5 bg-white p-8 shadow-elev1 transition-all duration-300 hover:-translate-y-1 hover:shadow-elev3"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-ink-700 transition-transform group-hover:scale-110">
                  <p.icon className="h-7 w-7" aria-hidden />
                </div>
                <h3 className="font-display text-xl font-bold text-ink-700">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values + impact */}
      <section className="bg-ink-800">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div className="space-y-4">
              <div className="text-xs font-bold uppercase tracking-widest text-brand-400">
                How we work
              </div>
              <h2 className="font-display text-3xl font-black tracking-tight text-white md:text-4xl">
                Honest by design.
              </h2>
              <ul className="space-y-3">
                {VALUES.map((v) => (
                  <li key={v} className="flex items-start gap-3 text-ink-100">
                    <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" aria-hidden />
                    <span className="leading-relaxed">{v}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="group mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-semibold text-white shadow-elev1 transition-all hover:bg-brand-700"
              >
                Join us — learn or teach
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                ["11+", "Partner schools"],
                ["1000+", "Students reached"],
                ["100+", "Study resources"],
                ["98%", "Satisfaction rate"],
              ].map(([v, l]) => (
                <div key={l} className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
                  <p className="font-display text-4xl font-black text-brand-400">{v}</p>
                  <p className="mt-1 text-sm text-ink-200">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-2xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-600">
              The people
            </div>
            <h2 className="font-display text-3xl font-black tracking-tight text-ink-700 md:text-4xl">
              A team of educators, engineers and mentors.
            </h2>
            <p className="text-lg leading-relaxed text-slate-600">
              Photos are being gathered — names first, faces coming.
            </p>
          </div>
          <TeamGrid />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 rounded-xl bg-slate-50 px-8 py-14 shadow-elev2 md:px-12 md:py-16 lg:flex-row lg:items-center">
          <div className="max-w-xl space-y-3">
            <h2 className="font-display text-3xl font-black tracking-tight text-ink-800 md:text-4xl">
              Want in?
            </h2>
            <p className="leading-relaxed text-slate-600">
              Bring a skill, bring a school, or bring both. The marketplace is open from day one.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/register"
              className="inline-flex h-12 items-center justify-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white shadow-elev1 transition-all hover:bg-brand-700"
            >
              Join free
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold text-ink-700 transition-all hover:border-brand-500 hover:text-brand-700"
            >
              Book a free audit
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}