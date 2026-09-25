"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import type { Program } from "../page";

export default function ProgramDetailPage() {
  const params = useParams<{ slug: string }>();
  const [item, setItem] = useState<Program | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    api<{ item: Program }>(`/cms/public/programs/${params.slug}`)
      .then((d) => setItem(d.item))
      .catch(() => setMissing(true));
  }, [params.slug]);

  if (missing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="font-display text-2xl font-bold text-ink-700">Not found</p>
        <p className="mt-2 text-slate-600">That program is not published (or never existed).</p>
        <Link href="/programs" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-brand-600 px-5 text-sm font-semibold text-white">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to programs
        </Link>
      </div>
    );
  }
  if (!item) return <p className="mx-auto max-w-3xl px-4 py-24 text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/programs" className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Programs
      </Link>
      {item.coverUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={item.coverUrl} alt={item.title} className="mt-6 aspect-video w-full rounded-xl object-cover shadow-elev1" />
      )}
      <h1 className="mt-8 font-display text-4xl font-black leading-tight tracking-tighter text-ink-700 md:text-5xl">{item.title}</h1>
      <p className="mt-3 text-sm font-medium text-slate-500">
        {item.organization ? (
          <Link href={`/organizations/${item.organization.slug}`} className="text-brand-600 hover:underline">
            {item.organization.name}
          </Link>
        ) : (
          "Edu-Alt-Tech"
        )}
      </p>
      {item.pricePaise != null && (
        <p className="mt-4 inline-block rounded-full bg-brand-50 px-4 py-1.5 text-sm font-bold text-brand-700">
          {item.currency} {(item.pricePaise / 100).toLocaleString("en-IN")}
        </p>
      )}
      <div className="mt-8 space-y-4 text-lg leading-relaxed text-slate-700">
        {item.summary && <p>{item.summary}</p>}
        {item.body ? item.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>) : null}
      </div>
      <Link href="/contact" className="mt-10 inline-flex h-12 items-center justify-center rounded-full bg-brand-600 px-6 text-sm font-semibold text-white shadow-elev1 hover:bg-brand-700">
        Enquire about this program
      </Link>
    </div>
  );
}