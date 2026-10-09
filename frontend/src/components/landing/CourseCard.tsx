import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import CoverImage from "@/components/ui/CoverImage";
import { formatPrice } from "@/lib/format";
import type { CourseListItem } from "@/lib/types";

export default function CourseCard({ course }: { course: CourseListItem }) {
  return (
    <Link
      href={`/courses/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-elev2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <CoverImage
          src={course.thumbnailUrl}
          fallback={course.category}
          className="transition duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-brand-700">
          <span className="rounded-full bg-brand-50 px-2.5 py-1">{course.category}</span>
          {course.gradeLevel && <span className="text-slate-500">{course.gradeLevel}</span>}
        </div>
        <h3 className="mt-3 font-display text-lg font-bold text-ink-900">{course.title}</h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-ink-600">{course.description}</p>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
          <span className="font-semibold text-ink-900">{formatPrice(course.pricePaise, course.currency)}</span>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
            View course
            <ArrowForward fontSize="small" />
          </span>
        </div>
      </div>
    </Link>
  );
}
