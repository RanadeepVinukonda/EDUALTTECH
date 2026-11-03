import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import PartnerStrip from "./PartnerStrip";

export default function TrustCredibility() {
  return (
    <section className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <PartnerStrip className="bg-white" divider={false} scroll showAll={false} />

        <div className="mt-8 flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-lg text-sm leading-relaxed text-slate-600">
            Learners grow; practitioners earn by teaching.
          </p>
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
