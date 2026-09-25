"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  ClipboardCheck,
  Presentation,
  TrendingUp,
  Users,
} from "lucide-react";
import AnimatedCounter from "./AnimatedCounter";
import FeaturedSections from "./FeaturedSections";
import { api } from "@/lib/api";

const STATIC_LOGOS = [
  { src: "/school_logos/genesis.png", alt: "Genesis school logo" },
  { src: "/school_logos/new_era.jpg", alt: "New Era school logo" },
  { src: "/school_logos/sharada_vidhyalaya.jpeg", alt: "Sharada Vidhyalaya school logo" },
  { src: "/school_logos/mamasparsh.png", alt: "Mamasparsh logo" },
];

// Named photo slots on the homepage. Admin fills these via the Media manager.
// Each key is a `position` value on a MediaAsset; fallback is the static file.
const PHOTO_SLOTS = {
  "hero-1": "/static/EAT3.jpg",
  "hero-2": "/static/EAT4.jpg",
  "proof-feature": "/static/EAT4.jpg",
  "proof-1": "/static/EAT2.jpg",
  "proof-2": "/static/EAT3.jpg",
} as const;

interface MediaItem {
  id: string;
  alt: string | null;
  url: string;
  kind: string;
  category: string | null;
  position: string | null;
  width: number | null;
  height: number | null;
}

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

const stats = [
  { value: 11, label: "Partner Schools" },
  { value: 1000, label: "Students Reached", suffix: "+" },
  { value: 100, label: "Study Resources", suffix: "+" },
  { value: 98, label: "Satisfaction Rate", suffix: "%" },
];

const institutionServices = [
  {
    title: "EduAltTech",
    body: "The skill marketplace — students learn, providers teach. Classroom programs, mentoring and hands-on AI & coding classes.",
  },
  {
    title: "Digital solutions",
    body: "Websites, apps, ERP, AI tools — built, documented, deployed for schools and businesses.",
  },
  {
    title: "Marketing & admissions",
    body: "Ads, social creatives and local listings that fill school seats and grow brands.",
  },
];

export default function HomeLanding() {
  const [logos, setLogos] = useState<MediaItem[]>([]);
  const [photos, setPhotos] = useState<MediaItem[]>([]);

  useEffect(() => {
    api<{ items: MediaItem[] }>("/cms/public/media?kind=logo")
      .then((d) => setLogos(d.items))
      .catch(() => setLogos([]));
    api<{ items: MediaItem[] }>("/cms/public/media?kind=image")
      .then((d) => setPhotos(d.items))
      .catch(() => setPhotos([]));
  }, []);

  interface GalleryLogo {
  src: string;
  alt: string;
  width?: number | null;
  height?: number | null;
}

const gallery: GalleryLogo[] = logos.length > 0
    ? logos.map((l) => ({ src: l.url, alt: l.alt ?? l.category ?? "Partner", width: l.width, height: l.height }))
    : STATIC_LOGOS;
  const logoStyle = (l: GalleryLogo): React.CSSProperties => {
    const style: React.CSSProperties = {};
    if (l.height && l.height > 0) style.height = `${l.height}px`;
    if (l.width && l.width > 0) style.width = `${l.width}px`;
    return style;
  };
  const img = (slot: keyof typeof PHOTO_SLOTS) => photos.find((p) => p.position === slot)?.url ?? PHOTO_SLOTS[slot];
  const proofFeature = { img: img("proof-feature"), tag: "Student Build", title: "AI attendance project by school students", body: "Came from an idea in class → became a working prototype. Students shipped it, mentored end to end." };
  const proofRows = [
    { img: img("proof-1"), tag: "Mentoring", title: "Sector mentor coaching batch", body: "Working professional + weekly sessions, real problems." },
    { img: img("proof-2"), tag: "School Work", title: "Admissions portal for a school", body: "One of our digital-solutions builds. See all services below." },
  ];

  return (
    <div className="min-h-screen overflow-hidden bg-white text-slate-900">
      {/* Hero — marketplace first */}
      <section className="relative flex min-h-[calc(100vh-4rem)] items-center overflow-hidden pb-16 pt-16">
        <div className="relative z-10 mx-auto grid w-full max-w-7xl items-start gap-12 px-6 lg:grid-cols-12">
          <div className="space-y-6 text-left lg:col-span-7">
            <p className="fade-up text-xs font-bold uppercase tracking-widest text-brand-600">
              Kakinada · Andhra Pradesh
            </p>
            <h1 className="fade-up fade-up-1 font-display text-5xl font-black leading-[0.95] tracking-tighter text-ink-700 md:text-6xl lg:text-7xl">
              Got skill?
              <br />
              <span className="text-brand-600">Got students.</span>
            </h1>

            <p className="fade-up fade-up-1 max-w-xl text-lg leading-relaxed text-slate-600 md:text-xl">
              If you know how to do something well, we&apos;ll train you to teach it — and pay you
              for it. If you need a mentor, we&apos;ll match you with someone who does the work
              every day. Kakinada first, the rest of Andhra Pradesh next.
            </p>

            <div className="fade-up fade-up-2 flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/register"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-semibold text-white shadow-elev1 transition-all hover:bg-brand-700 active:scale-[0.98]"
              >
                Join free — teach or learn
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <span className="text-sm text-slate-500">
                or{" "}
                <Link href="/courses" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
                  explore courses
                </Link>
                {" · "}
                <Link href="/work" className="font-semibold text-brand-700 underline-offset-4 hover:underline">
                  see our work
                </Link>
              </span>
            </div>
          </div>

          <div className="relative hidden md:block lg:col-span-5">
            <div className="grid grid-cols-1 gap-3">
              <div className="fade-up fade-up-2 h-80 overflow-hidden rounded-xl bg-slate-100 shadow-elev2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img("hero-1")}
                  loading="lazy"
                  decoding="async"
                  alt="EduAltTech classroom and training"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="fade-up fade-up-3 h-64 overflow-hidden rounded-xl bg-slate-100 shadow-elev1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img("hero-2")}
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

      {/* Proof band — stats with editorial dividers, not cards */}
      <section className="px-6">
        <div className="mx-auto max-w-7xl border-y border-slate-200 py-8">
          <dl className="grid grid-cols-2 divide-y divide-slate-200 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {stats.map((stat, i) => (
              <div key={stat.label} className={`px-0 py-4 sm:py-0 ${i % 2 === 1 ? "pl-6 sm:pl-8" : "sm:pl-8"} ${i === 0 ? "sm:pl-0" : ""}`}>
                <dd className="font-display text-3xl font-black text-ink-700 md:text-4xl">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix || ""} />
                </dd>
                <dt className="mt-1 text-[11px] font-semibold uppercase leading-tight tracking-wider text-slate-500">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Trust strip — logo marquee */}
      <section className="px-6 pb-10 pt-8 md:pb-14">
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
                    {gallery.map((logo) => (
                      <div
                        key={logo.src}
                        className="flex shrink-0 items-center justify-center"
                        style={logoStyle(logo)}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={logo.src}
                          loading="lazy"
                          decoding="async"
                          alt={logo.alt}
                          className="max-h-24 w-auto object-contain mix-blend-multiply"
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
      <section className="px-6 py-16 md:py-24">
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
            <div className="group flex flex-col gap-6 rounded-xl border border-black/5 bg-white p-8 shadow-elev1 transition-shadow duration-300 hover:shadow-elev3 md:p-10">
              <span className="self-start text-xs font-black uppercase tracking-widest text-brand-600">
                Teach what you know
              </span>
              <div className="font-display text-4xl font-black leading-[1.05] tracking-tight text-ink-700 md:text-[2.75rem]">
                Any skill can
                <br />
                be taught.
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                One account lets you teach what you do daily. A skill test decides, not your
                degree, and you get paid per class.
              </p>
              <ul className="flex-1 space-y-2.5 text-sm text-slate-600">
                {[
                  "Skill test decides, not your degree",
                  "Trained to teach — not by memorisation",
                  "Paid per class. Ratings grow your reputation.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden />
                    <span className="leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/about"
                className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold text-ink-700 transition-all hover:border-brand-500 hover:text-brand-700 active:scale-[0.98]"
              >
                See how it works
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="group flex flex-col gap-6 rounded-xl border border-black/5 bg-white p-8 shadow-elev1 transition-shadow duration-300 hover:shadow-elev3 md:p-10">
              <span className="self-start text-xs font-black uppercase tracking-widest text-slate-400">
                Learn anything
              </span>
              <div className="font-display text-4xl font-black leading-[1.05] tracking-tight text-ink-700 md:text-[2.75rem]">
                Any skill can
                <br />
                be learned.
              </div>
              <p className="text-sm leading-relaxed text-slate-600">
                Pay per course, no subscriptions. Mentors who do the work daily, practice labs
                and study resources — all in the same account.
              </p>
              <ul className="flex-1 space-y-2.5 text-sm text-slate-600">
                {[
                  "Pay per course you enroll in",
                  "Practitioners, not PhD walls",
                  "Practice labs + study resources included",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-3">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" aria-hidden />
                    <span className="leading-relaxed">{line}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/courses"
                className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold text-ink-700 transition-all hover:border-brand-500 hover:text-brand-700 active:scale-[0.98]"
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

      {/* How it works — 4 steps, all visible, editorial top rules */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-2xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-600">
              How It Works
            </div>
            <h2 className="font-display text-3xl font-black tracking-tight text-ink-700 md:text-5xl">
              Four steps from skill to salary.
            </h2>
          </div>

          <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {howItWorks.map((item, i) => (
              <div key={item.title} className="border-t-2 border-brand-600 pt-5">
                <span className="text-[11px] font-black tracking-widest text-slate-400">
                  0{i + 1}
                </span>
                <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-ink-700">
                  <item.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-display text-lg font-bold leading-snug text-ink-700">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10">
            <Link
              href="/courses"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold text-ink-700 transition-all hover:border-brand-500 hover:text-brand-700"
            >
              Browse courses &amp; practice
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Proof from the field — one feature, two supporting rows */}
      <section className="px-6 py-16 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 max-w-2xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-widest text-brand-600">
              Proof, Not Promises
            </div>
            <h2 className="font-display text-3xl font-black tracking-tight text-ink-700 md:text-5xl">
              Our work in the wild.
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-5">
            <article className="flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-elev1 transition-shadow duration-300 hover:shadow-elev3 md:col-span-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={proofFeature.img}
                loading="lazy"
                decoding="async"
                alt={proofFeature.title}
                className="h-72 w-full object-cover md:h-80"
              />
              <div className="flex-1 space-y-2 p-6">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {proofFeature.tag}
                </span>
                <h3 className="font-display text-xl font-bold leading-snug text-ink-700">
                  {proofFeature.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600">{proofFeature.body}</p>
              </div>
            </article>

            <div className="flex flex-col gap-6 md:col-span-2">
              {proofRows.map((item) => (
                <article
                  key={item.title}
                  className="flex flex-1 overflow-hidden rounded-xl border border-black/5 bg-slate-50 shadow-elev1 transition-shadow duration-300 hover:shadow-elev3"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.img}
                    loading="lazy"
                    decoding="async"
                    alt={item.title}
                    className="w-32 shrink-0 object-cover sm:w-40"
                  />
                  <div className="flex-1 space-y-1.5 p-5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {item.tag}
                    </span>
                    <h3 className="font-bold leading-snug text-ink-700">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-600">{item.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Setsuzoku group */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-center md:gap-10">
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-widest text-brand-600">
                Part of the Setsuzoku group
              </div>
              <h2 className="font-display text-2xl font-black text-ink-700 md:text-3xl">
                Three businesses. One group.
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
      <section className="px-6 py-16 md:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-8 rounded-xl bg-slate-50 px-8 py-14 shadow-elev2 md:px-12 md:py-16 lg:flex-row lg:items-center">
            <div className="max-w-2xl space-y-3">
              <h2 className="font-display text-3xl font-black tracking-tight text-ink-800 md:text-4xl">
                One login. Every feature.
              </h2>
              <p className="leading-relaxed text-slate-600">
                Courses, practice labs and study resources — plus the option to
                teach what you know. All in one account, no separate provider sign-up.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold text-ink-700 transition-all hover:border-brand-500 hover:text-brand-700 active:scale-[0.98]"
              >
                Explore the full platform
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}