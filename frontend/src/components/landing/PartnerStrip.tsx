import Link from "next/link";
import { cn } from "@/lib/cn";

const PARTNERS = [
  { src: "/media/logos/genesis.png", name: "Genesis" },
  { src: "/media/logos/mamasparsh.png", name: "MamaSparsh" },
  { src: "/media/logos/new_era.jpg", name: "New Era" },
  { src: "/media/logos/sharada_vidhyalaya.jpeg", name: "Sharada Vidhyalaya" },
  { src: "/media/logos/joy.jpeg", name: "Joy E.M. High School" },
  { src: "/media/logos/newerahyd.jpeg", name: "New Era Educational Institutions" },
  { src: "/media/logos/st Antony.jpeg", name: "St. Anthony's Schools" },
];

/**
 * Schools and organizations we work with. `scroll` renders an auto-scrolling
 * marquee (landing page); otherwise a static grid with each org's name under
 * its logo (partners page).
 */
export default function PartnerStrip({
  className,
  divider = true,
  scroll = false,
  showAll = true,
}: {
  className?: string;
  divider?: boolean;
  scroll?: boolean;
  showAll?: boolean;
}) {
  return (
    <section
      aria-label="Schools and organizations we work with"
      className={cn("bg-slate-50", divider && "border-y border-slate-200", className)}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold text-slate-500">
          School and learning partners
        </p>

        {scroll ? (
          <div className="marquee mt-6">
            <ul className="marquee-track list-none">
              {[...PARTNERS, ...PARTNERS, ...PARTNERS, ...PARTNERS].map((p, i) => (
                <li
                  key={`${p.name}-${i}`}
                  aria-hidden={i >= PARTNERS.length || undefined}
                  className="flex h-28 w-64 shrink-0 items-center justify-center px-6 sm:h-32 sm:w-80 sm:px-8"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.src}
                    alt={p.name}
                    loading="lazy"
                    className="max-h-20 sm:max-h-24 w-auto max-w-full object-contain opacity-95 transition-opacity duration-300 hover:opacity-100"
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {PARTNERS.map((p) => (
              <li
                key={p.name}
                className="flex flex-col items-center gap-3 rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 "
              >
                <div className="flex h-20 items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.src}
                    alt={p.name}
                    loading="lazy"
                    className="max-h-16 w-auto max-w-full object-contain opacity-95 transition duration-300 hover:opacity-100"
                  />
                </div>
                <span className="text-center text-xs font-semibold text-ink-800">{p.name}</span>
              </li>
            ))}
          </ul>
        )}

        {showAll && (
          <p className="mt-6 text-center text-xs font-semibold text-slate-500">
            <Link href="/partners" className="text-brand-700 hover:text-brand-800 hover:underline">
              View partner schools and programs
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
