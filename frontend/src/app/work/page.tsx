import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { publicFetch } from "@/lib/server-api";
import type { WorkItem } from "@/lib/types";
import SectionHeading from "@/components/landing/SectionHeading";
import LinkButton from "@/components/ui/LinkButton";
import WorkBrowser from "@/components/work/WorkBrowser";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "Applications, educational technology, and digital solutions built by EduAltTech for schools and organizations.",
  alternates: { canonical: "/work" },
};

export default async function WorkPage() {
  const work = await publicFetch<{ items: WorkItem[] }>("/cms/public/work", { limit: 50 });
  const items = work?.items ?? [];

  return (
    <div className="bg-white">
      <section className="border-b border-slate-200 bg-slate-50">
        <div className={`${wrap} py-10 sm:py-14`}>
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-sm text-ink-600">
              <li>
                <Link href="/" className="hover:text-ink-900">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-slate-400">
                <ChevronRight fontSize="small" />
              </li>
              <li className="font-medium text-ink-900" aria-current="page">
                Our Work
              </li>
            </ol>
          </nav>
          <SectionHeading
            as="h1"
            eyebrow="Our Work"
            title="Applications and digital solutions we have built"
            lead="Practical software made for educational and organizational needs — the same problem-solving our courses teach. We present work here only when it is verified and cleared for public view."
          />
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className={wrap}>
          {items.length > 0 ? (
            <WorkBrowser items={items} />
          ) : (
            <div className="max-w-3xl rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 sm:p-12">
              <h2 className="font-display text-xl font-bold text-ink-900">Work is being published</h2>
              <p className="mt-3 leading-relaxed text-ink-600">
                We publish projects once they are confirmed and cleared for public view. If you would like to
                hear about recent work relevant to your school or organization, get in touch.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <LinkButton href="/services">Services &amp; Programs</LinkButton>
                <LinkButton href="/services#enquiry" variant="secondary">
                  Contact us
                </LinkButton>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Conversion */}
      {items.length > 0 && (
        <section className="bg-slate-50 py-16 sm:py-20">
          <div className={`${wrap} text-center`}>
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold text-ink-900">
              Need something similar for your school?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink-600">
              Tell us the problem you are trying to solve and we will start from there.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <LinkButton href="/services" size="lg">
                Services &amp; Programs
              </LinkButton>
              <LinkButton href="/services#enquiry" variant="secondary" size="lg">
                Contact us
              </LinkButton>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
