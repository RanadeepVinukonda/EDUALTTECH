"use client";

import Link from "next/link";

export interface CourseCardData {
  id: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  thumbnailUrl: string | null;
  teacher: { name: string };
  _count: { enrollments: number; modules: number };
  pricePaise?: number | null;
}

export function CourseCard({ course, footer }: { course: CourseCardData; footer?: React.ReactNode }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm"
    >
      {course.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={course.thumbnailUrl} alt="" className="h-40 w-full object-cover" />
      ) : (
        <div className="flex h-40 items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100">
          <span className="rounded-xl brand-grad px-3 py-1.5 text-sm font-bold text-white">{course.subject[0]}</span>
        </div>
      )}
      <div className="p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{course.subject}</p>
        <h2 className="font-display mt-2 text-lg font-semibold text-slate-900 group-hover:text-brand-800">{course.title}</h2>
        <p className="mt-2 line-clamp-2 text-sm text-slate-600">{course.description}</p>
        <p className="mt-4 text-xs text-slate-500">
          {course.teacher.name} · {course._count.modules} modules · {course._count.enrollments} enrolled
          {course.pricePaise != null && (
            <span className="ml-1 font-semibold text-ink-700">· ₹{(course.pricePaise / 100).toLocaleString("en-IN")}</span>
          )}
        </p>
      </div>
      {footer && <div className="border-t border-slate-100">{footer}</div>}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 translate-y-full bg-brand-600 py-3 text-center text-sm font-bold uppercase tracking-wider text-white transition-transform duration-150 group-hover:translate-y-0"
      >
        Visit Course
      </span>
    </Link>
  );
}