import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import CoverImage from "@/components/ui/CoverImage";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

export interface CourseCardCourse {
  slug: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  category?: string | null;
  domain?: string | null;
  tags?: string[] | null;
  features?: string[] | null;
  pricePaise?: number;
  currency?: string;
}

/**
 * One course card, used everywhere a course is shown as a tile.
 * The whole card is a single stretched link; row-level controls render above it.
 */
export default function CourseCard({
  course,
  href,
  priceLabel,
  badge,
  progressPct,
  mentor,
  stats,
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
  stats?: { label: string; value: string }[];
  actions?: React.ReactNode;
  viewLabel?: string;
  unavailable?: boolean;
  className?: string;
}) {
  const { slug, title, description, thumbnailUrl, category, domain, tags, pricePaise, currency = "INR" } = course;
  const link = href ?? `/courses/${slug}`;
  const price = priceLabel ?? (typeof pricePaise === "number" ? formatPrice(pricePaise, currency) : null);
  const eyebrow = domain || category;
  const visibleTags = (tags ?? []).filter(Boolean).slice(0, 3);
  const remainingTagCount = Math.max(0, (tags ?? []).filter(Boolean).length - visibleTags.length);
  const showProgress = typeof progressPct === "number";
  const pct = showProgress ? Math.min(100, Math.max(0, progressPct as number)) : 0;

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border border-rule bg-[#ffffff] shadow-elev1 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-elev2",
        className,
      )}
    >
      {!unavailable && (
        <Link
          href={link}
          aria-label={`View ${title}`}
          className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
        />
      )}

      <div className="relative aspect-[16/10] overflow-hidden bg-paper-2">
        <CoverImage
          src={thumbnailUrl ?? null}
          alt=""
          fallback={category ?? title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        {badge && (
          <span className="absolute left-3 top-3 rounded-md bg-[#ffffff]/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-elev1 backdrop-blur">
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 font-display text-base font-semibold leading-snug text-ink transition-colors group-hover:text-brand-800">
          {title}
        </h3>
        {eyebrow && <p className="mt-1 text-xs text-muted">{eyebrow}</p>}

        {description && (
          <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-ink-2">{description}</p>
        )}
        {visibleTags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {visibleTags.map((tag) => (
              <span key={tag} className="rounded-full border border-rule bg-paper-2 px-2.5 py-0.5 text-[11.5px] font-medium text-ink-2">
                {tag}
              </span>
            ))}
            {remainingTagCount > 0 && (
              <span className="text-xs font-medium text-muted">+{remainingTagCount}</span>
            )}
          </div>
        )}
        {mentor && <p className="mt-3 text-xs text-slate-500">Mentor: {mentor}</p>}

        {showProgress ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-[11.5px] font-semibold text-slate-500">
              <span>Progress</span>
              <span className="tabular-nums text-brand-700">{pct}%</span>
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-slate-100">
              <span className="block h-full rounded-full bg-brand-600" style={{ width: `${pct}%` }} />
            </div>
          </div>
        ) : stats && stats.length > 0 ? (
          <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-3">
            {stats.map((s) => (
              <div key={s.label} className="min-w-0">
                <dt className="text-xs text-slate-500">{s.label}</dt>
                <dd className="mt-0.5 truncate text-[13px] font-semibold text-ink-900">{s.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <span className="font-display text-sm font-semibold text-ink-900">{price}</span>
          <div className="relative z-20 flex items-center justify-end gap-2">
            {actions}
            {unavailable ? (
              <span className="text-xs font-medium text-slate-400">Unavailable</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-ink-700 transition group-hover:text-brand-700">
                {viewLabel}
                <ArrowForward sx={{ fontSize: 14 }} aria-hidden />
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
