import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import OpenInNew from "@mui/icons-material/OpenInNew";
import { publicFetch } from "@/lib/server-api";
import type { WorkItem } from "@/lib/types";
import SectionHeading from "@/components/landing/SectionHeading";
import LinkButton from "@/components/ui/LinkButton";
import WorkBrowser from "@/components/work/WorkBrowser";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

const PRODUCTS = [
  { name: "Genesis", img: "/media/Products/Genesis.png", site: "https://www.genesisedu.in" },
  { name: "Joy School", img: "/media/Products/joy%20school.png", site: "https://www.joyschool.online/" },
  { name: "MamaSparsh", img: "/media/Products/mamasparsh.png", site: "https://www.mamasparshschool.in/" },
];

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
          <h2 className="mb-8 font-display text-2xl font-bold text-ink-900">Platforms we have built</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map((p) => (
              <a
                key={p.name}
                href={p.site}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <div className="flex h-52 items-center justify-center border-b border-slate-100 bg-slate-50 p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.img}
                    alt={`${p.name} website`}
                    loading="lazy"
                    className="max-h-36 w-auto max-w-full object-contain"
                  />
                </div>
                <div className="flex items-center justify-between gap-3 px-5 py-4">
                  <span className="font-display text-lg font-bold text-ink-900">{p.name}</span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 group-hover:text-brand-800">
                    Visit site
                    <OpenInNew fontSize="small" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {items.length > 0 && (
        <section className="border-t border-slate-200 bg-slate-50 py-16 sm:py-20">
          <div className={wrap}>
            <WorkBrowser items={items} />
          </div>
        </section>
      )}

      {/* Conversion */}
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
    </div>
  );
}
