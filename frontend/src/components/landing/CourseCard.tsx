import Link from "next/link";
import CoverImage from "@/components/ui/CoverImage";
import { EyeIcon } from "@/components/ui/IconActionButton";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface CourseCardCourse {
  slug: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  category?: string | null;
  domain?: string | null;
  features?: string[] | null;
  pricePaise?: number;
  currency?: string;
}

/**
 * One course card, used everywhere a course is shown as a tile.
 * The whole card is a single stretched link; the view control uses the shared
 * icon-button primitive (eye opens on card hover). `actions` render above the
 * link for row-level controls.
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
  const { slug, title, description, thumbnailUrl, category, domain, features, pricePaise, currency = "INR" } = course;
  const link = href ?? `/courses/${slug}`;
  const price = priceLabel ?? (typeof pricePaise === "number" ? formatPrice(pricePaise, currency) : null);
  const chip = domain || category;
  const featureList = (features ?? []).filter(Boolean).slice(0, 4);
  const showProgress = typeof progressPct === "number";
  const pct = showProgress ? Math.min(100, Math.max(0, progressPct as number)) : 0;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-elev1",
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
        <CoverImage src={thumbnailUrl ?? null} alt="" fallback={category ?? title} className="h-full w-full object-cover" />
        {badge && (
          <span className="absolute right-3 top-3 rounded-full bg-ink-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3.5 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 font-display text-base font-bold leading-snug text-ink-900">{title}</h3>
          {chip && (
            <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              <span className="h-px w-4 bg-slate-300" />
              {chip}
            </span>
          )}
        </div>

        {description && <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-600">{description}</p>}
        {mentor && <p className="text-xs text-slate-500">Mentor · {mentor}</p>}

        {showProgress ? (
          <div className="mt-1 space-y-2">
            <div className="flex items-center justify-between text-[11.5px] font-semibold text-slate-500">
              <span>Progress</span>
              <span className="font-extrabold tabular-nums text-brand-700">{pct}%</span>
            </div>
            <div className="relative h-1 rounded-full bg-[#e3eef4]">
              <span className="absolute inset-y-0 left-0 rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
              <span className="absolute right-0 top-1/2 h-1 w-1 -translate-y-1/2 rounded-full bg-slate-500" />
            </div>
          </div>
        ) : featureList.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-3">
            {featureList.map((f) => (
              <div key={f} className="flex items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                    <path d="M9,16.17L4.83,12L3.41,13.41L9,19L21,7L19.59,5.59L9,16.17Z" />
                  </svg>
                </span>
                <span className="text-xs font-semibold text-ink-700">{f}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="font-display text-base font-bold text-ink-900">{price}</span>
          <div className="relative z-20 flex items-center gap-2">
            {actions}
            {unavailable ? (
              <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500">
                Unavailable
              </span>
            ) : (
              <Link href={link} aria-label={viewLabel} className="hv-btn hv-btn--view">
                <EyeIcon />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
