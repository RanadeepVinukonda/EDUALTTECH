"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, GraduationCap } from "lucide-react";
import { api } from "@/lib/api";

interface CourseItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  subject: string;
  gradeLevel: string | null;
  teacher: { name: string };
  _count: { enrollments: number; modules: number };
}

interface ProviderItem {
  id: string;
  name: string;
  avatarUrl: string | null;
  education: string | null;
  bio: string | null;
  courseTitle: string;
  subject: string;
  enrollments: number;
}

function CourseCard({ c }: { c: CourseItem }) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <Link
      href={`/courses/${c.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-black/5 bg-white shadow-elev1 transition-all duration-300 hover:-translate-y-1 hover:shadow-elev3"
    >
      <div className="h-40 overflow-hidden bg-slate-100">
        {c.thumbnailUrl && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.thumbnailUrl}
            alt={c.title}
            loading="lazy"
            decoding="async"
            onError={() => setImgOk(false)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-600 to-ink-700">
            <span className="font-display px-4 text-center text-xl font-black tracking-tight text-white">
              {c.subject}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
          {c.subject}
          {c.gradeLevel ? ` · ${c.gradeLevel}` : ""}
        </p>
        <h3 className="font-display mt-1.5 text-lg font-bold leading-snug text-ink-700 group-hover:text-brand-700">
          {c.title}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600">{c.description}</p>
        <div className="mt-auto flex items-center justify-between pt-4 text-xs text-slate-500">
          <span>{c.teacher.name}</span>
          <span>{c._count.modules} modules · {c._count.enrollments} enrolled</span>
        </div>
      </div>
    </Link>
  );
}

function ProviderCard({ p }: { p: ProviderItem }) {
  const [imgOk, setImgOk] = useState(true);
  const initials = p.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
  return (
    <div className="flex flex-col items-center rounded-xl border border-black/5 bg-white p-6 text-center shadow-elev1">
      {p.avatarUrl && imgOk ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.avatarUrl}
          alt={p.name}
          loading="lazy"
          decoding="async"
          onError={() => setImgOk(false)}
          className="h-20 w-20 rounded-full object-cover ring-2 ring-brand-100"
        />
      ) : (
        <span className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 font-display text-2xl font-black text-brand-700 ring-2 ring-brand-200">
          {initials}
        </span>
      )}
      <h3 className="mt-4 font-display text-lg font-bold text-ink-700">{p.name}</h3>
      {p.education && (
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
          <GraduationCap className="h-3.5 w-3.5" aria-hidden />
          {p.education}
        </p>
      )}
      <p className="mt-1 text-xs font-semibold text-brand-600">{p.subject}</p>
      {p.bio && <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-600">{p.bio}</p>}
      <p className="mt-3 text-[11px] text-slate-400">
        {p.courseTitle} · {p.enrollments} enrolled
      </p>
    </div>
  );
}

function SectionHeading({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body?: string;
}) {
  return (
    <div className="mb-10 max-w-2xl space-y-3">
      <div className="text-xs font-bold uppercase tracking-widest text-brand-600">{kicker}</div>
      <h2 className="font-display text-3xl font-black tracking-tight text-ink-700 md:text-4xl">
        {title}
      </h2>
      {body && <p className="text-lg leading-relaxed text-slate-600">{body}</p>}
    </div>
  );
}

export default function FeaturedSections() {
  const [courses, setCourses] = useState<CourseItem[] | null>(null);
  const [providers, setProviders] = useState<ProviderItem[] | null>(null);

  useEffect(() => {
    api<{ items: CourseItem[] }>("/courses?limit=3")
      .then((d) => setCourses(d.items))
      .catch(() => setCourses([]));
    api<{ items: ProviderItem[] }>("/teachers/providers")
      .then((d) => setProviders(d.items.slice(0, 4)))
      .catch(() => setProviders([]));
  }, []);

  return (
    <>
      {/* Featured courses */}
      <section className="relative px-6 pt-8" id="courses">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              kicker="Learn from Practitioners"
              title="Famous courses, taught by who does it daily."
            />
            <Link
              href="/courses"
              className="mb-10 inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-slate-300 px-5 text-sm font-semibold text-ink-700 transition-all hover:border-brand-400 hover:text-brand-700"
            >
              All courses <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {courses === null ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-xl bg-slate-200/60" />
              ))}
            </div>
          ) : courses.length === 0 ? null : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <CourseCard key={c.id} c={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Providers */}
      <section className="relative px-6 py-16" id="providers">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <SectionHeading
              kicker="Skill Marketplace"
              title="Providers already on the platform."
              body="Approved mentors — the faces behind the courses students love."
            />
            <Link
              href="/teachers/apply"
              className="mb-10 inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-brand-600 px-5 text-sm font-semibold text-white shadow-elev1 transition-all hover:bg-brand-700"
            >
              Become a provider
            </Link>
          </div>

          {providers === null ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-64 animate-pulse rounded-xl bg-slate-200/60" />
              ))}
            </div>
          ) : providers.length === 0 ? null : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {providers.map((p) => (
                <ProviderCard key={p.id} p={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}