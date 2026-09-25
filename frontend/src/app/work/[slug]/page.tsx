"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import type { WorkItem } from "../page";

export default function WorkDetailPage() {
  const params = useParams<{ slug: string }>();
  const [item, setItem] = useState<WorkItem | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    api<{ item: WorkItem }>(`/cms/public/work/${params.slug}`)
      .then((d) => setItem(d.item))
      .catch(() => setMissing(true));
  }, [params.slug]);

  if (missing) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="font-display text-2xl font-bold text-ink-700">Not found</p>
        <p className="mt-2 text-slate-600">That project is not published (or never existed).</p>
        <Link href="/work" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full brand-grad px-5 text-sm font-semibold text-white">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Back to our work
        </Link>
      </div>
    );
  }
  if (!item) return <p className="mx-auto max-w-3xl px-4 py-24 text-slate-500">Loading…</p>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/work" className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:underline">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Our work
      </Link>
      <span className="mt-6 block text-[10px] font-bold uppercase tracking-widest text-brand-600">{item.category}</span>
      <h1 className="mt-2 font-display text-4xl font-black leading-tight tracking-tighter text-ink-700 md:text-5xl">{item.title}</h1>
      {item.organization && (
        <span className="mt-3 inline-block text-sm font-medium text-brand-600">By {item.organization.name}</span>
      )}
      {item.coverUrl && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={item.coverUrl} alt={item.title} className="mt-8 aspect-video w-full rounded-xl object-cover shadow-elev1" />
      )}
      <div className="mt-8 space-y-4 text-lg leading-relaxed text-slate-700">
        {item.summary && <p>{item.summary}</p>}
        {item.body ? item.body.split("\n\n").map((p, i) => <p key={i}>{p}</p>) : null}
      </div>
    </div>
  );
}