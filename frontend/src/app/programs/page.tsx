"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export interface Program {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string | null;
  pricePaise: number | null;
  currency: string;
  coverUrl: string | null;
  organization: { name: string; slug: string } | null;
}

export default function ProgramsPage() {
  const [items, setItems] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ items: Program[] }>("/cms/public/programs")
      .then((d) => setItems(d.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative overflow-hidden bg-white px-6 pb-32 pt-16">
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h1 className="mb-6 font-display text-5xl font-black leading-[0.9] tracking-tighter text-ink-700 md:text-7xl">
            Programs
            <br />
            <span className="text-brand-600">that move the needle.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-medium text-slate-600">
            Tuition, workshops and school programs — structured, measurable and mentored end to end.
          </p>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading programs…</p>
        ) : items.length === 0 ? (
          <p className="mx-auto max-w-xl rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            Programs are being planned — check back soon or reach out on the contact page.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => (
              <div key={p.id} className="flex flex-col">
                <Link
                  href={`/programs/${p.slug}`}
                  className="group flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-elev1 transition-all duration-300 hover:-translate-y-1 hover:shadow-elev3"
                >
                  {p.coverUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.coverUrl} alt={p.title} loading="lazy" decoding="async" className="h-48 w-full object-cover" />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 font-display text-4xl font-black text-brand-400">
                      {p.title[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-1 flex-col gap-2 p-6">
                    <h2 className="font-display text-xl font-bold leading-snug text-ink-700">{p.title}</h2>
                    <p className="text-sm leading-relaxed text-slate-600">{p.summary}</p>
                    {p.pricePaise != null && (
                      <p className="mt-auto pt-3 text-sm font-bold text-ink-700">
                        {p.currency} {(p.pricePaise / 100).toLocaleString("en-IN")}
                      </p>
                    )}
                  </div>
                </Link>
                {p.organization && (
                  <span className="mt-2 text-xs font-medium text-slate-500">{p.organization.name}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}