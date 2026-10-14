import Link from "next/link";
import { cn } from "@/lib/cn";

const PARTNERS = [
  { src: "/media/logos/genesis.png", name: "Genesis" },
  { src: "/media/logos/mamasparsh.png", name: "MamaSparsh" },
  { src: "/media/logos/new_era.jpg", name: "New Era" },
  { src: "/media/logos/sharada_vidhyalaya.jpeg", name: "Sharada Vidhyalaya" },
];

/**
 * Static strip of the schools and organizations we work with — each logo
 * shown with the organization's name underneath.
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

        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {PARTNERS.map((p) => (
            <li
              key={p.name}
              className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-elev1"
            >
              <div className="flex h-20 items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.src}
                  alt={p.name}
                  loading="lazy"
                  className="max-h-16 w-auto max-w-full object-contain"
                />
              </div>
              <span className="text-center text-sm font-semibold text-ink-800">{p.name}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-center text-sm text-slate-500">
          <Link href="/partners" className="font-semibold text-brand-700 hover:text-brand-800">
            See all partners &amp; organizations
          </Link>
        </p>
      </div>
    </section>
  );
}
