"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { api, ApiError } from "@/lib/api";
import type { CourseListItem } from "@/lib/types";
import CourseCardLive from "./CourseCardLive";
import SectionHeading from "./SectionHeading";

interface ListResponse {
  items: CourseListItem[];
  total: number;
  hasMore: boolean;
}

export default function CurriculumPreview() {
  const [items, setItems] = useState<CourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    api<ListResponse>("/courses", {
      method: "GET",
      auth: false,
      signal: ctrl.signal,
      query: { sort: "newest", page: 1, limit: 4 },
    })
      .then((d) => setItems(d.items))
      .catch((e: unknown) => {
        if (ctrl.signal.aborted) return;
        setError(e instanceof ApiError ? e.message : "Could not load courses.");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, []);

  return (
    <section className="bg-white py-16 sm:py-24 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 border-b border-slate-200">
          <SectionHeading
            title="Featured courses with working mentors"
            lead="Every course pairs a roadmap with a vetted practitioner who reviews your work."
          />
          <Link
            href="/courses"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink-900 transition hover:text-brand-700"
          >
            All courses
            <ArrowForward fontSize="inherit" aria-hidden />
          </Link>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="aspect-[16/9] w-full animate-pulse bg-slate-200" />
                <div className="space-y-3 p-5">
                  <div className="h-4 w-1/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <p className="text-ink-600">{error}</p>
            <Link href="/courses" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800">
              Browse the catalog →
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="font-display text-lg font-semibold text-ink-900">Courses are being published</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
              New cohorts open soon. Browse the catalog to see what is live.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((c) => (
              <CourseCardLive key={c.id} course={c} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
