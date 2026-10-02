"use client";

import Link from "next/link";
import ProgressBar from "./ProgressBar";
import type { Enrollment } from "./ResumeCard";

export default function CourseProgressList({ enrollments }: { enrollments: Enrollment[] }) {
  return (
    <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {enrollments.map((e) => {
        const done = e.progressPct >= 100;
        return (
          <li key={e.id}>
            <Link
              href={`/courses/${e.course.slug}`}
              className="block h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-elev2 transition hover:border-brand-300"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{e.course.subject}</p>
                {done && (
                  <span className="shrink-0 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                    Completed
                  </span>
                )}
              </div>
              <p className="font-display mt-1 line-clamp-2 font-semibold text-slate-900">{e.course.title}</p>
              <div className="mt-4 flex items-center gap-3">
                <ProgressBar value={e.progressPct} label={`${e.course.title} completion`} />
                <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-600">
                  {Math.round(e.progressPct)}%
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
