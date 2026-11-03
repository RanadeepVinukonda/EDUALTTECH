"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { api } from "@/lib/api";
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
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    api<ListResponse>("/courses", {
      method: "GET",
      auth: false,
      signal: ctrl.signal,
      query: { sort: "newest", page: 1, limit: 4 },
    })
      .then((d) => setItems(d.items))
      .catch(() => {
        if (ctrl.signal.aborted) return;
        setError("Courses unavailable");
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [reloadKey]);

  return (
    <section className="bg-white py-12 sm:py-16 border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 pb-8 border-b border-slate-200">
          <SectionHeading
            title="Courses with mentors"
            lead="Learn through practical, mentor-led courses."
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
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" aria-hidden>
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
          <div role="alert" className="mt-8 rounded-xl border border-rule bg-paper p-8 text-center">
            <h3 className="font-display text-lg font-semibold text-ink">{error}</h3>
            <p className="mt-2 text-sm text-ink-2">Try again, or browse all courses.</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => setReloadKey((key) => key + 1)}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-rule bg-paper px-4 py-2 text-sm font-semibold text-ink transition-colors hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Try again
              </button>
              <Link
                href="/courses"
                className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-ink transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Browse catalog
              </Link>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h3 className="font-display text-lg font-semibold text-ink-900">No courses to show</h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
              Browse the catalog or explore free learning resources.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((c) => (
              <CourseCardLive key={c.id} course={c} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
