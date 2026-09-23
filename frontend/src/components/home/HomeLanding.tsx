"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  CheckCircle,
  ClipboardCheck,
  Presentation,
  TrendingUp,
  Users,
} from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";
import FeaturedSections from "./FeaturedSections";

const partnerLogos = [
  { src: "/school_logos/genesis.png", alt: "Genesis school logo" },
  { src: "/school_logos/new_era.jpg", alt: "New Era school logo" },
  { src: "/school_logos/sharada_vidhyalaya.jpeg", alt: "Sharada Vidhyalaya school logo" },
  { src: "/school_logos/mamasparsh.png", alt: "Mamasparsh logo", xl: true },
];

const howItWorks = [
  {
    icon: ClipboardCheck,
    title: "Join & prove your skill",
    body: "Sign up and take a hands-on skill assessment. What you can do counts, not your degree.",
  },
  {
    icon: Presentation,
    title: "Get trained to teach",
    body: "Our curriculum program: how to run an interactive class, explain concepts clearly, and keep students engaged.",
  },
  {
    icon: Users,
    title: "Get matched to students",
    body: "Tuition students, school visits, college sessions — matched by subject, sector and location.",
  },
  {
    icon: TrendingUp,
    title: "Earn & grow",
    body: "Paid per class. Rise in rating. Take on more students. We handle scheduling and billing.",
  },
];

const stepsImages = [
  { src: "/static/EAT2.jpg", pos: "object-[center_25%]", alt: "EduAltTech hands-on skill assessment" },
  { src: "/static/EAT3.jpg", pos: "object-[center_40%]", alt: "EduAltTech teacher training session" },
  { src: "/static/EAT4.jpg", pos: "object-[center_60%]", alt: "EduAltTech student matching in action" },
  { src: "/static/EAT2.jpg", pos: "object-[center_70%]", alt: "EduAltTech mentors growing and earning" },
];

const stats = [
  { value: 11, label: "Partner Schools" },
  { value: 1000, label: "Students Reached", suffix: "+" },
  { value: 100, label: "Study Resources", suffix: "+" },
  { value: 98, label: "Satisfaction Rate", suffix: "%" },
];

const proofCards = [
  {
    img: "/static/EAT4.jpg",
    tag: "Student Build",
    title: "AI attendance project by school students",
    body: "Came from an idea in class → became a working prototype.",
  },
  {
    img: "/static/EAT2.jpg",
    tag: "Mentoring",
    title: "Sector mentor coaching batch",
    body: "Working professional + weekly sessions, real problems.",
  },
  {
    img: "/static/EAT3.jpg",
    tag: "School Work",
    title: "Admissions portal for a school",
    body: "One of our digital-solutions builds. See all services below.",
  },
];

const institutionServices = [
  {
    title: "Digital solutions",
    body: "Websites, apps, ERP, AI tools — built, documented, deployed.",
  },
  {
    title: "Marketing & admissions",
    body: "Ads, social creatives and local listings that fill school seats.",
  },
  {
    title: "Classroom programs",
    body: "AI, coding and problem-solving classes in your classrooms, taught by our trained providers.",
  },
];

export default function HomeLanding() {
  const [revealed, setRevealed] = useState(1);
  const allRevealed = revealed === howItWorks.length;

  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-900">
      {/* Hero — marketplace first */}
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden pb-20 pt-16">
        <div className="pointer-events-none absolute -right-32 -top-32 h-[560px] w-[560px] rounded-full bg-brand-100/60" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-[420px] w-[420px] rounded-full bg-ink-100/70" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-start gap-12 px-6 lg:grid-cols-12">
          <div className="space-y-6 text-left lg:col-span-7">
            <h1 className="fade-up font-display text-5xl font-black leading-[0.95] tracking-tighter text-ink-700 md:text-7xl lg:text-8xl">
              Got skill?
              <br />
              <span className="text-brand-600">Got students.</span>
            </h1>

            <p className="fade-up fade-up-1 max-w-xl text-lg leading-relaxed text-slate-600 md:text-xl">
              If you know how to do something well, we&apos;ll train you to teach it — and pay you
              for it. If you need a mentor, we&apos;ll match you with someone who does the work
              every day. Kakinada first, the rest of Andhra Pradesh next.
            </p>

            <div className="fade-up fade-up-2 flex flex-wrap gap-3 pt-2">
              <Link
                href="/register"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-semibold text-white shadow-elev1 transition-all hover:bg-brand-700 active:scale-[0.98]"
              >
                Join EduAltTech
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/courses"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold text-ink-700 transition-all hover:border-brand-400 hover:text-brand-700"
              >
                Browse courses
              </Link>
            </div>

            <div className="fade-up fade-up-3 grid max-w-2xl grid-cols-2 gap-3 pt-6 sm:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="px-1">
                  <div className="font-display text-3xl font-black text-ink-700 md:text-4xl">
                    <AnimatedCounter value={stat.value} suffix={stat.suffix || ""} />
                  </div>
                  <div className="mt-1 text-[11px] font-semibold uppercase leading-tight tracking-wider text-slate-500">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative hidden md:block lg:col-span-5">
            <div className="grid grid-cols-1 gap-3">
              <div className="fade-up fade-up-2 h-80 overflow-hidden rounded-xl bg-slate-100 shadow-elev2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/static/EAT3.jpg"
                  loading="lazy"
                  decoding="async"
                  alt="EduAltTech classroom and training"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="fade-up fade-up-3 h-64 overflow-hidden rounded-xl bg-slate-100 shadow-elev1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/static/EAT4.jpg"
                  loading="lazy"
                  decoding="async"
                  alt="EduAltTech workshop and projects"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip — logo marquee */}
      <section className="relative z-10 -mt-6 px-6 pb-8 md:pb-12">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-xl bg-white px-6 py-7 shadow-elev1">
            <div className="mb-6 w-full text-center text-xs font-bold uppercase tracking-widest text-brand-600">
              Trusted by schools across India
            </div>
            <div className="overflow-hidden">
              <div className="marquee-track flex w-max">
                {[0, 1].map((copy) => (
                  <div
                    key={copy}
                    aria-hidden={copy === 1}
                    className="flex min-w-full items-center justify-around gap-x-10 px-10"
                  >
                    {partnerLogos.map((logo) => (
                      <div
                        key={logo.src}
                        className={`flex shrink-0 items-center justify-center ${logo.xl ? "h-36 w-44" : "h-24"}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logo.src}
                          loading="lazy"
                          decoding="async"
                          alt={logo.alt}
                          className={`object-contain mix-blend-multiply ${logo.xl ? "h-full w-full" : "max-h-20 w-auto"}`}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Provider / Seeker doors */}
      <section className="relative px-6 pb-24 pt-12 md:pb-32 md:pt-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-2xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-600">
              Skill Marketplace
            </div>
            <h2 className="font-display text-3xl font-black tracking-tight text-ink-700 md:text-5xl">
              One platform. Two roles.
            </h2>
            <p className="text-lg leading-relaxed text-slate-600">
              Join once, then choose <strong>per course</strong>: apply to teach it, or pay to
              learn it.
            </p>
          </div>

          <div className="grid items-stretch gap-5 md:grid-cols-2">
            {/* Provider */}
            <div className="group flex flex-col gap-6 rounded-xl border border-black/5 bg-white p-8 shadow-elev1 transition-shadow duration-300 hover:shadow-elev3 md:p-10">
              <span className="inline-flex self-start rounded-full border border-brand-300 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-600">
                Provider
              </span>
              <div className="font-display text-4xl font-black leading-[1.05] tracking-tight text-brand-600 md:text-[2.75rem]">
                Teach what
                <br />
                you do daily.
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                Apply per course — a skill test decides, not your degree. We train you to teach
                interactively, and you get paid per class.
              </p>
              <ul className="flex-1 space-y-2.5 text-sm text-slate-600">
                {[
                  "Skill test decides, not your degree",
                  "Trained to teach — not by memorisation",
                  "Paid per class. Ratings grow your reputation.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <span className="leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-semibold text-white shadow-elev1 transition-all hover:bg-brand-700 active:scale-[0.98]"
              >
                Join to apply
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Learner */}
            <div className="group flex flex-col gap-6 rounded-xl border border-black/5 bg-white p-8 shadow-elev1 transition-shadow duration-300 hover:shadow-elev3 md:p-10">
              <span className="inline-flex self-start rounded-full border border-slate-300 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Learner
              </span>
              <div className="font-display text-4xl font-black leading-[1.05] tracking-tight text-ink-700 md:text-[2.75rem]">
                Learn from
                <br />
                practitioners.
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                Pay per course — no subscriptions. Mentors who do the work daily, with practice
                labs and the AI tutor included.
              </p>
              <ul className="flex-1 space-y-2.5 text-sm text-slate-600">
                {[
                  "Pay per course you enroll in",
                  "Practitioners, not PhD walls",
                  "Practice labs + AI tutor included",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                    <span className="leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/courses"
                className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink-700 px-6 text-sm font-semibold text-white shadow-elev1 transition-all hover:bg-ink-800 active:scale-[0.98]"
              >
                Browse courses free
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured courses + providers (live from backend) */}
      <FeaturedSections />

      {/* How it works — 4 steps, reveal on demand */}
      <section className="relative px-6 pb-16 pt-8 md:pb-24 md:pt-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 max-w-2xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-600">
              How It Works
            </div>
            <h2 className="font-display text-3xl font-black tracking-tight text-ink-700 md:text-5xl">
              Four steps from skill to salary.
            </h2>
          </div>

          <div className="lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-12">
            <div className="max-w-3xl">
              <div className="mb-8 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-700 transition-[width] duration-500 ease-out"
                  style={{ width: `${(revealed / howItWorks.length) * 100}%` }}
                />
              </div>

              <div className="space-y-3">
                {howItWorks.map((item, i) => (
                  <div
                    key={item.title}
                    aria-hidden={i >= revealed}
                    className={`rounded-xl border border-black/5 bg-white px-6 py-5 shadow-elev1 transition-all duration-400 ${
                      i < revealed
                        ? "translate-y-0 opacity-100"
                        : "pointer-events-none translate-y-4 opacity-0"
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                        <item.icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-bold leading-snug text-ink-700">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {item.body}
                        </p>
                      </div>
                      <span className="ml-auto shrink-0 text-[11px] font-black tracking-widest text-slate-400">
                        0{i + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                {allRevealed ? (
                  <Link
                    href="/register"
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-semibold text-white shadow-elev1 transition-all hover:bg-brand-700 active:scale-[0.98]"
                  >
                    Join the marketplace
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => setRevealed((n) => Math.min(n + 1, howItWorks.length))}
                    className="group inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-semibold text-white shadow-elev1 transition-all hover:bg-brand-700 active:scale-[0.98]"
                  >
                    Reveal next step
                    <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="sticky top-24 aspect-[4/5] overflow-hidden rounded-xl border border-black/5 shadow-elev2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={revealed}
                  src={stepsImages[revealed - 1]!.src}
                  loading="lazy"
                  decoding="async"
                  alt={stepsImages[revealed - 1]!.alt}
                  className={`h-full w-full object-cover transition-opacity duration-400 ${stepsImages[revealed - 1]!.pos}`}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proof from the field */}
      <section className="relative px-6 pb-16 pt-8 md:pb-24 md:pt-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-2xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-600">
              Proof, Not Promises
            </div>
            <h2 className="font-display text-3xl font-black tracking-tight text-ink-700 md:text-5xl">
              Our work in the wild.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {proofCards.map((item) => (
              <div
                key={item.title}
                className="flex flex-col overflow-hidden rounded-xl border border-black/5 bg-slate-50 shadow-elev1 transition-shadow duration-300 hover:shadow-elev3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.img}
                  loading="lazy"
                  decoding="async"
                  alt={item.title}
                  className="h-48 w-full object-cover"
                />
                <div className="flex-1 space-y-2 p-5">
                  <span className="inline-flex rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-800">
                    {item.tag}
                  </span>
                  <h3 className="font-bold leading-snug text-ink-700">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For schools & franchises */}
      <section className="relative px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center md:gap-10">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-brand-600">
                Also for institutions
              </div>
              <h2 className="font-display text-2xl font-black text-ink-700 md:text-3xl">
                For schools &amp; franchises
              </h2>
            </div>
            <Link
              href="/services"
              className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-slate-300 px-5 text-sm font-semibold text-ink-700 transition-all hover:bg-brand-50"
            >
              All services
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {institutionServices.map((item) => (
              <div
                key={item.title}
                className="space-y-2 rounded-xl border border-black/5 bg-slate-50 p-6 shadow-elev1"
              >
                <h3 className="font-bold text-ink-700">{item.title}</h3>
                <p className="text-sm leading-relaxed text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA — provider-first */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 rounded-xl bg-brand-100 px-8 py-14 shadow-elev2 md:px-12 md:py-16 lg:flex-row lg:items-center">
            <div className="max-w-xl space-y-3">
              <h2 className="font-display text-3xl font-black tracking-tight text-brand-900 md:text-4xl">
                Your skill belongs in a classroom.
              </h2>
              <p className="leading-relaxed text-brand-800/80">
                Join free. Prove your skill. We do the matching — you do what you&apos;re good at.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/register"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-semibold text-white shadow-elev1 transition-all hover:bg-brand-700 active:scale-[0.98]"
              >
                Become a provider
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-12 items-center justify-center rounded-full border border-brand-800/30 px-6 text-sm font-semibold text-brand-900 transition-all hover:bg-white/60 active:scale-[0.98]"
              >
                Book a free audit
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
