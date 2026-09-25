import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, Building2, Megaphone } from "lucide-react";

export const metadata: Metadata = {
  title: "Setsuzoku Group",
  description:
    "Setsuzoku is the group behind Edu-Alt-Tech — an education skill marketplace, in-house digital solutions studio and the marketing that fills school seats.",
  alternates: { canonical: "https://www.edualttech.com/setsuzoku" },
};

const BRANDS = [
  {
    icon: BookOpen,
    name: "EduAltTech",
    role: "Skill marketplace",
    body: "Students learn, providers teach. Classroom programs, mentoring and hands-on AI & coding classes.",
    href: "/",
    cta: "Visit EduAltTech",
  },
  {
    icon: Building2,
    name: "Digital solutions",
    role: "Build studio",
    body: "Websites, apps, ERP, AI tools — built, documented and deployed for schools and businesses.",
    href: "/work",
    cta: "See our work",
  },
  {
    icon: Megaphone,
    name: "Marketing & admissions",
    role: "Growth arm",
    body: "Ads, social creatives and local listings that fill school seats and grow brands.",
    href: "/services",
    cta: "Explore services",
  },
];

export default function SetsuzokuPage() {
  return (
    <div className="relative overflow-hidden bg-white px-6 pb-32 pt-16">
      <div className="mx-auto max-w-[1200px]">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-brand-600">The group behind Edu-Alt-Tech</p>
          <h1 className="mb-6 font-display text-5xl font-black leading-[0.9] tracking-tighter text-ink-700 md:text-7xl">
            Setsuzoku.
            <br />
            <span className="text-brand-600">Three businesses. One group.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-medium text-slate-600">
            What&apos;s the point of building a learning platform if nobody hears about it? One
            business creates the learning, one builds the tools behind it, one puts both in front
            of the right students.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {BRANDS.map((brand) => (
            <div
              key={brand.name}
              className="flex flex-col rounded-xl border border-slate-200 bg-white p-8 shadow-elev1 transition-all duration-300 hover:-translate-y-1 hover:shadow-elev3"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-ink-700">
                <brand.icon className="h-7 w-7" aria-hidden />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{brand.role}</span>
              <h2 className="mt-1 font-display text-2xl font-black text-ink-700">{brand.name}</h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{brand.body}</p>
              <Link
                href={brand.href}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                {brand.cta} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-xl border border-black/5 bg-slate-50 p-10 text-center shadow-elev1">
          <h2 className="font-display text-2xl font-black text-ink-800">Why it works</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-slate-600">
            The group funds classroom programs from its own build work, which keeps student
            pricing honest. Every project below pays for the teaching above.
          </p>
          <Link
            href="/services"
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full brand-grad px-6 text-sm font-semibold text-white shadow-elev1 transition-all hover:bg-brand-700"
          >
            All services <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}