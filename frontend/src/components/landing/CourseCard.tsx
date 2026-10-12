import Link from "next/link";
import Visibility from "@mui/icons-material/Visibility";
import CoverImage from "@/components/ui/CoverImage";
import { buttonClass } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface CourseCardCourse {
  slug: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  category?: string | null;
  pricePaise?: number;
  currency?: string;
}

/**
 * One course card, used everywhere a course is shown as a tile.
 * The whole card is a single stretched link; the "View" pill is styled with the
 * shared button primitive (same base as the danger/delete buttons) plus an eye
 * icon, and `actions` render above the link for row-level controls.
 */
export default function CourseCard({
  course,
  href,
  priceLabel,
  badge,
  progressPct,
  mentor,
  actions,
  viewLabel = "View course",
  unavailable = false,
  className,
}: {
  course: CourseCardCourse;
  href?: string;
  priceLabel?: string;
  badge?: React.ReactNode;
  progressPct?: number;
  mentor?: string;
  actions?: React.ReactNode;
  viewLabel?: string;
  unavailable?: boolean;
  className?: string;
}) {
  const { slug, title, description, thumbnailUrl, category, pricePaise, currency = "INR" } = course;
  const link = href ?? `/courses/${slug}`;
  const price = priceLabel ?? (typeof pricePaise === "number" ? formatPrice(pricePaise, currency) : null);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-elev1 transition duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-elev2",
        className,
      )}
    >
      {!unavailable && (
        <Link
          href={link}
          aria-label={`View ${title}`}
          className="absolute inset-0 z-10 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
        />
      )}

      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        <CoverImage
          src={thumbnailUrl ?? null}
          alt=""
          fallback={category ?? title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.05]"
        />
        {category && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-brand-700 shadow-sm backdrop-blur">
            {category}
          </span>
        )}
        {badge && (
          <span className="absolute right-3 top-3 rounded-full bg-ink-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-ink-900">{title}</h3>
        {description && <p className="line-clamp-2 text-sm leading-relaxed text-ink-600">{description}</p>}
        {mentor && <p className="text-xs text-slate-500">Mentor · {mentor}</p>}

        {typeof progressPct === "number" && (
          <div className="mt-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-600 transition-all"
                style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] font-medium text-slate-500">{progressPct}% complete</p>
          </div>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="font-display text-base font-bold text-ink-900">{price}</span>
          <div className="relative z-20 flex items-center gap-2">
            {actions}
            {unavailable ? (
              <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500">
                Unavailable
              </span>
            ) : (
              <span className={buttonClass("primary", "sm")}>
                <Visibility fontSize="small" aria-hidden />
                {viewLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
