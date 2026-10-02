"use client";

import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export default function RecommendationCard({
  icon: Icon,
  title,
  why,
  href,
  cta,
}: {
  icon: LucideIcon;
  title: string;
  why: string;
  href: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-elev2 transition hover:border-brand-300"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <Icon className="h-4.5 w-4.5" />
      </span>
      <p className="font-display mt-3 font-semibold text-slate-900">{title}</p>
      <p className="mt-1 flex-1 text-sm text-slate-600">{why}</p>
      <span className="mt-3 flex items-center gap-1 text-sm font-semibold text-brand-700">
        {cta}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
