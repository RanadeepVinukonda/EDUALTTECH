"use client";

import Link from "next/link";
import { Bookmark as BookmarkIcon } from "lucide-react";

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

export function CourseCard({
  course,
  saved,
  onToggleBookmark,
}: {
  course: CourseCardData;
  saved?: boolean;
  onToggleBookmark?: (course: CourseCardData) => void;
}) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group block [perspective:1000px]"
    >
      <div
        style={{
          border: "3px solid #0f172a",
          backgroundColor: "#0f172a",
          backgroundImage:
            "linear-gradient(135deg, transparent 18.75%, #e2e8f0 0 31.25%, transparent 0), repeating-linear-gradient(45deg, #e2e8f0 -6.25% 6.25%, #0f172a 0 18.75%)",
          backgroundSize: "60px 60px",
          backgroundPosition: "0 0, 0 0",
        }}
        className="relative w-full transition-all duration-500 [transform-style:preserve-3d] group-hover:[background-position:-100px_100px,-100px_100px] group-hover:[transform:rotate3d(0.5,1,0,12deg)]"
      >
        {onToggleBookmark && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleBookmark(course);
            }}
            aria-pressed={saved}
            aria-label={saved ? "Remove from bookmarks" : "Bookmark this course"}
            style={{ transform: "translate3d(0, 0, 80px)" }}
            className="absolute right-3 top-3 flex h-12 w-12 items-center justify-center border border-brand-500 bg-slate-900 shadow-[rgba(100,100,111,0.2)_0_17px_10px_-10px] transition-transform duration-500 hover:[transform:translate3d(0,0,100px)]"
          >
            <BookmarkIcon className={`h-5 w-5 ${saved ? "fill-brand-500 text-brand-500" : "text-brand-500"}`} />
          </button>
        )}

        <div className="content-box bg-brand-600 pt-16 [transform-style:preserve-3d]">
          <div className="flex items-start justify-between">
            <span
              className="text-xs font-semibold uppercase tracking-wide text-slate-900 [transform:translate3d(0,0,40px)] transition-transform duration-500 group-hover:[transform:translate3d(0,0,60px)]"
            >
              {course.subject}
            </span>
            {course.pricePaise != null && (
              <span
                className="rounded border-2 border-slate-900 bg-slate-900 px-2 py-0.5 text-xs font-bold text-brand-400 [transform:translate3d(0,0,40px)] transition-transform duration-500 group-hover:[transform:translate3d(0,0,60px)]"
              >
                ₹{(course.pricePaise / 100).toLocaleString("en-IN")}
              </span>
            )}
          </div>

          <h2
            className="mt-2 font-display text-lg font-bold text-slate-900 [transform:translate3d(0,0,40px)] transition-transform duration-500 group-hover:[transform:translate3d(0,0,60px)]"
          >
            {course.title}
          </h2>

          <p
            className="mt-2 line-clamp-2 text-xs font-semibold text-slate-900/80 [transform:translate3d(0,0,30px)] transition-transform duration-500 group-hover:[transform:translate3d(0,0,60px)]"
          >
            {course.description}
          </p>

          <p
            className="mt-3 text-xs font-semibold text-slate-900/70 [transform:translate3d(0,0,30px)] transition-transform duration-500 group-hover:[transform:translate3d(0,0,60px)]"
          >
            {course.teacher.name} · {course._count.modules} modules · {course._count.enrollments} enrolled
          </p>

          <span
            className="mt-4 inline-block cursor-pointer bg-slate-900 px-3 py-1.5 text-[9px] font-black uppercase tracking-wide text-brand-400 [transform:translate3d(0,0,20px)] transition-transform duration-500 group-hover:[transform:translate3d(0,0,60px)]"
          >
            Visit Course
          </span>
        </div>
      </div>
    </Link>
  );
}