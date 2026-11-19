import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import CheckCircle from "@mui/icons-material/CheckCircle";
import PartnerStrip from "./PartnerStrip";

const MSME_HIGHLIGHTS = [
  "Govt. of India Registered",
  "MSME Verified Certificates",
  "Trusted by Partner Schools",
];

export default function TrustCredibility() {
  return (
    <section
      aria-label="Official recognition and school partners"
      className="border-b border-rule bg-paper-2 py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Prestigious MSME Accreditation Spotlight */}
        <div className="overflow-hidden rounded-2xl border border-brand-200/90 bg-[#ffffff] shadow-elev2">
          <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
            <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-brand-100 bg-paper p-3 shadow-elev1 sm:h-24 sm:w-24">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/media/logos/msme-seeklogo.png"
                  alt="Ministry of MSME, Government of India"
                  className="h-full w-full object-contain"
                  width={80}
                  height={80}
                />
              </div>

              <div className="min-w-0">
                <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                  MSME Registered &amp; Approved Enterprise
                </h2>

                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-2">
                  Recognized by the Ministry of Micro, Small &amp; Medium Enterprises, Government of India — backing our mentored courses, verified certificates, and school programs.
                </p>

                <ul className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-ink">
                  {MSME_HIGHLIGHTS.map((item) => (
                    <li key={item} className="inline-flex items-center gap-1.5">
                      <CheckCircle sx={{ fontSize: 15 }} className="text-brand-600" aria-hidden />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-rule pt-4 lg:flex-col lg:items-end lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
              <Link
                href="/courses"
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2"
              >
                Explore certified courses
                <ArrowForward sx={{ fontSize: 16 }} aria-hidden />
              </Link>
              <Link
                href="/partners"
                className="inline-flex items-center gap-1.5 px-1 py-1 text-sm font-semibold text-ink transition-colors hover:text-brand-700"
              >
                School partnerships
                <ArrowForward fontSize="inherit" aria-hidden />
              </Link>
            </div>
          </div>
        </div>

        {/* Partner Schools Marquee */}
        <div className="mt-10 border-t border-rule/80 pt-8">
          <PartnerStrip className="bg-transparent" divider={false} scroll showAll={false} />
        </div>
      </div>
    </section>
  );
}
