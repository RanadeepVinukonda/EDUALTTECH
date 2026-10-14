import Link from "next/link";
import { cn } from "@/lib/cn";

const PARTNERS = [
  { src: "/media/logos/genesis.png", name: "Genesis" },
  { src: "/media/logos/mamasparsh.png", name: "MamaSparsh" },
  { src: "/media/logos/new_era.jpg", name: "New Era" },
  { src: "/media/logos/sharada_vidhyalaya.jpeg", name: "Sharada Vidhyalaya" },
];

/**
 * Auto-scrolling strip of the schools and organizations we work with.
 * The set is rendered twice so the CSS marquee loops seamlessly; the
 * duplicate copy is hidden from assistive tech.
 */
export default function PartnerStrip({ className, divider = true }: { className?: string; divider?: boolean }) {
  return (
    <section
      aria-label="Schools and organizations we work with"
      className={cn("bg-slate-50", divider && "border-y border-slate-200", className)}
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Schools &amp; organizations we work with
        </p>

        <div className="marquee mt-8">
          <ul className="marquee-track list-none">
            {[...PARTNERS, ...PARTNERS].map((p, i) => (
              <li
                key={`${p.name}-${i}`}
                aria-hidden={i >= PARTNERS.length || undefined}
                className="flex h-28 w-64 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white px-8 shadow-elev1"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt={p.name}
                  loading="lazy"
                  className="max-h-16 w-auto max-w-full object-contain"
                />
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/partners" className="font-semibold text-brand-700 hover:text-brand-800">
            See all partners &amp; organizations
          </Link>
        </p>
      </div>
    </section>
  );
}
