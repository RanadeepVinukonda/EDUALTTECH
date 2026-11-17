import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import PartnerStrip from "./PartnerStrip";

export default function TrustCredibility() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PartnerStrip className="bg-white" divider={false} scroll showAll={false} />

        <div className="mt-8 flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/logos/msme-seeklogo.png"
              alt="MSME Government of India"
              className="h-8 w-auto object-contain shrink-0"
              width={32}
              height={32}
            />
            <div className="leading-tight">
              <span className="text-xs font-bold text-ink-900 block">MSME Approved Enterprise</span>
              <span className="text-[11px] text-slate-500">Government of India Registered</span>
            </div>
          </div>
          <Link
            href="/partners"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink-900 transition hover:text-brand-700"
          >
            School partnerships
            <ArrowForward fontSize="inherit" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
