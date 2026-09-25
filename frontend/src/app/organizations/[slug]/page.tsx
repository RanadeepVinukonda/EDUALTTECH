"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";
import type { Organization } from "../page";

interface OrgDetail extends Organization {
  description: string | null;
  contactEmail: string | null;
  workItems: Array<{ id: string; slug: string; title: string; summary: string; category: string; coverUrl: string | null }>;
  programs: Array<{ id: string; slug: string; title: string; summary: string; pricePaise: number | null; currency: string; coverUrl: string | null }>;
}

export default function OrganizationDetailPage() {
  const params = useParams<{ slug: string }>();
  const [org, setOrg] = useState<OrgDetail | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    api<{ item: OrgDetail }>(`/cms/public/organizations/${params.slug}`)
      .then((d) => setOrg(d.item))
      .catch(() => setMissing(true));
  }, [params.slug]);

  if (missing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="font-display text-2xl font-bold text-ink-700">Not found</p>
        <p className="mt-2 text-slate-600">That school is not published (or never existed).</p>
        <Link href="/organizations" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to schools
        </Link>
      </div>
    );
  }
  if (!org) return <p className="mx-auto max-w-3xl px-4 py-24 text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <Link href="/organizations" className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> All schools
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          {org.logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={org.logoUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-100 font-display text-2xl font-black text-brand-700">
              {org.name[0]?.toUpperCase()}
            </span>
          )}
          <div>
            <h1 className="font-display text-4xl font-black leading-tight tracking-tighter text-ink-700">{org.name}</h1>
            {org.summary && <p className="mt-1 max-w-2xl text-lg text-slate-600">{org.summary}</p>}
          </div>
        </div>
        {org.websiteUrl && (
          <a
            href={org.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-300 px-5 text-sm font-semibold text-slate-700 hover:border-brand-400 hover:text-brand-700"
          >
            <ExternalLink className="h-4 w-4" aria-hidden /> Visit website
          </a>
        )}
      </div>

      {org.description && <div className="mt-8 space-y-4 text-lg leading-relaxed text-slate-700">{org.description.split("\n\n").map((p, i) => <p key={i}>{p}</p>)}</div>}

      {org.workItems.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold text-ink-800">Work with this school</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {org.workItems.map((w) => (
              <Link
                key={w.id}
                href={`/work/${w.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-elev1 transition-all duration-300 hover:-translate-y-1 hover:shadow-elev3"
              >
                {w.coverUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={w.coverUrl} alt="" className="h-40 w-full object-cover" />
                ) : (
                  <div className="flex h-40 items-center justify-center bg-gradient-to-br from-brand-100 to-brand-50 font-display text-2xl font-black text-brand-400">
                    {w.title[0]?.toUpperCase()}
                  </div>
                )}
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600">{w.category}</span>
                  <h3 className="font-display text-base font-bold leading-snug text-ink-700">{w.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{w.summary}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {org.programs.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold text-ink-800">Programs</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {org.programs.map((p) => (
              <Link
                key={p.id}
                href={`/programs/${p.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-elev1 transition-all duration-300 hover:-translate-y-1 hover:shadow-elev3"
              >
                <h3 className="font-display text-base font-bold leading-snug text-ink-700">{p.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{p.summary}</p>
                {p.pricePaise != null && (
                  <p className="mt-3 text-sm font-bold text-ink-700">
                    {p.currency} {(p.pricePaise / 100).toLocaleString("en-IN")}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}