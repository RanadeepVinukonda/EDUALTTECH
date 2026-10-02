"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProgressBar from "./ProgressBar";

export interface Enrollment {
  id: string;
  progressPct: number;
  status: string;
  course: { id: string; title: string; slug: string; subject: string; thumbnailUrl: string | null };
}

/** Featured "pick up where you left off" card — the closest unfinished course. */
export default function ResumeCard({ enrollment }: { enrollment: Enrollment }) {
  const { course } = enrollment;
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-elev2 transition hover:border-brand-300 sm:flex-row sm:items-center"
    >
      {course.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={course.thumbnailUrl}
          alt=""
          className="h-28 w-full shrink-0 rounded-xl object-cover sm:h-24 sm:w-40"
        />
      ) : (
        <div className="flex h-28 w-full shrink-0 items-center justify-center rounded-xl bg-brand-50 text-sm font-semibold text-brand-700 sm:h-24 sm:w-40">
          {course.subject}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Continue where you left off</p>
        <p className="font-display mt-1 truncate text-lg font-semibold text-slate-900">{course.title}</p>
        <div className="mt-3 flex items-center gap-3">
          <ProgressBar value={enrollment.progressPct} label={`${course.title} completion`} />
          <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-600">
            {Math.round(enrollment.progressPct)}%
          </span>
        </div>
      </div>

      <span className="flex shrink-0 items-center gap-1.5 rounded-xl brand-grad px-4 py-2 text-sm font-semibold text-white">
        Continue
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}
