"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

export interface WorkItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string | null;
  category: string;
  coverUrl: string | null;
  publishedAt: string | null;
  organization: { name: string; slug: string } | null;
}

const FALLBACK = [
  {
    slug: "mentor-coaching-batch",
    category: "Mentoring",
    title: "Sector mentor coaching batch",
    summary: "Working professionals run weekly sessions with students on real problems — not textbook theory.",
    coverUrl: "/static/EAT2.jpg",
    org: null,
  },
  {
    slug: "school-admissions-portal",
    category: "School work",
    title: "Admissions portal for a school",
    summary: "A school admissions portal designed, built and deployed — enquiry capture to seat confirmation.",
    coverUrl: "/static/EAT3.jpg",
    org: null,
  },
  {
    slug: "ai-attendance-project",
    category: "Student build",
    title: "AI attendance project by school students",
    summary: "Started as an idea in class, shipped as a working prototype — mentored end to end by our team.",
    coverUrl: "/static/EAT4.jpg",
    org: null,
  },
] as const;

export default function WorkPage() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ items: WorkItem[] }>("/cms/public/work")
      .then((d) => setItems(d.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const shown = items.length > 0 ? items.map((i) => ({ slug: i.slug, category: i.category, title: i.title, summary: i.summary, coverUrl: i.coverUrl, org: i.organization })) : FALLBACK;

  return (
    <div className="relative overflow-hidden bg-white px-6 pb-32 pt-16">
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h1 className="mb-6 font-display text-5xl font-black leading-[0.9] tracking-tighter text-ink-700 md:text-7xl">
            Our Work
            <br />
            <span className="text-brand-600">in the wild.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-medium text-slate-600">
            Proof, not promises. Student builds, school projects and mentoring batches we have
            delivered — and the people behind them.
          </p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((p) => (
            <div key={p.slug} className="flex flex-col">
              <Link
                href={items.length > 0 ? `/work/${p.slug}` : "#"}
                className="group flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-elev1 transition-all duration-300 hover:-translate-y-1 hover:shadow-elev3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.coverUrl || "/static/EAT2.jpg"}
                  alt={p.title}
                  loading="lazy"
                  decoding="async"
                  className="h-56 w-full object-cover"
                />
                <div className="flex flex-1 flex-col gap-2 p-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600">{p.category}</span>
                  <h2 className="font-display text-xl font-bold leading-snug text-ink-700">{p.title}</h2>
                  <p className="text-sm leading-relaxed text-slate-600">{p.summary}</p>
                </div>
              </Link>
              {p.org && (
                <Link href={`/organizations/${p.org.slug}`} className="mt-2 text-xs font-medium text-slate-500 hover:text-brand-600">
                  {p.org.name} →
                </Link>
              )}
            </div>
          ))}
        </div>

        {loading && <p className="mt-8 text-center text-sm text-slate-400">Loading portfolio…</p>}

        <div className="mt-16 rounded-xl border border-black/5 bg-slate-50 p-10 text-center shadow-elev1">
          <h2 className="font-display text-2xl font-black text-ink-800">Want work like this?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-600">
            We build websites, apps, ERP and AI tools for schools and businesses — documented,
            deployed and supported.
          </p>
          <Link
            href="/services"
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-600 px-6 text-sm font-semibold text-white shadow-elev1 transition-all hover:bg-brand-700"
          >
            See our services <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}