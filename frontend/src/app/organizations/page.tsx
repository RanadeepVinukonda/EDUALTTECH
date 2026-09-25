"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { api } from "@/lib/api";

export interface Organization {
  id: string;
  slug: string;
  name: string;
  type: string;
  summary: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
}

const TYPE_LABELS: Record<string, string> = {
  SCHOOL: "School",
  PARTNER: "Partner",
  FRANCHISE: "Franchise",
  NGO: "NGO",
  OTHER: "Organization",
};

export default function OrganizationsPage() {
  const [items, setItems] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ items: Organization[] }>("/cms/public/organizations")
      .then((d) => setItems(d.items))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative overflow-hidden bg-white px-6 pb-32 pt-16">
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto mb-16 max-w-3xl text-center">
          <h1 className="mb-6 font-display text-5xl font-black leading-[0.9] tracking-tighter text-ink-700 md:text-7xl">
            Schools
            <br />
            <span className="text-brand-600">we build with.</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg font-medium text-slate-600">
            Schools, partners and communities where Edu-Alt-Tech works — every place is a lab,
            every class a project.
          </p>
        </div>

        {loading ? (
          <p className="text-slate-500">Loading schools…</p>
        ) : items.length === 0 ? (
          <p className="mx-auto max-w-xl rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
            No partner schools published yet — add them under Content in the admin.
          </p>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((o) => (
              <Link
                key={o.id}
                href={`/organizations/${o.slug}`}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-elev1 transition-all duration-300 hover:-translate-y-1 hover:shadow-elev3"
              >
                <div className="flex items-center gap-4">
                  {o.logoUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={o.logoUrl} alt="" className="h-14 w-14 rounded-lg object-cover" />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-lg bg-brand-100 font-display text-xl font-black text-brand-700">
                      {o.name[0]?.toUpperCase()}
                    </span>
                  )}
                  <div>
                    <h2 className="font-display text-lg font-bold leading-snug text-ink-700">{o.name}</h2>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600">
                      {TYPE_LABELS[o.type] ?? o.type}
                    </span>
                  </div>
                </div>
                {o.summary && <p className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">{o.summary}</p>}
                {o.websiteUrl && (
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600">
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden /> Visit website
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}