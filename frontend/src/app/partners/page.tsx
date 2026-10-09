import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import OpenInNew from "@mui/icons-material/OpenInNew";
import { publicFetch } from "@/lib/server-api";
import type { OrganizationItem } from "@/lib/types";
import SectionHeading from "@/components/landing/SectionHeading";
import CoverImage from "@/components/ui/CoverImage";
import LinkButton from "@/components/ui/LinkButton";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

const TYPE_LABEL: Record<string, string> = {
  SCHOOL: "School partners",
  PARTNER: "Partners",
  FRANCHISE: "Franchises",
  NGO: "NGOs & community",
  OTHER: "Organizations",
};

export const metadata: Metadata = {
  title: "Partners & Organizations",
  description:
    "Schools and organizations EduAltTech works with to support practical education and technology.",
  alternates: { canonical: "/partners" },
};

export default async function PartnersPage() {
  const orgs = await publicFetch<{ items: OrganizationItem[] }>("/cms/public/organizations");
  const items = orgs?.items ?? [];

  const groups = Object.entries(
    items.reduce<Record<string, OrganizationItem[]>>((acc, o) => {
      (acc[o.type] ??= []).push(o);
      return acc;
    }, {}),
  );

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
                Partners &amp; Organizations
              </li>
            </ol>
          </nav>
          <SectionHeading
            as="h1"
            eyebrow="Partners & Organizations"
            title="Working together for practical education"
            lead="Supporting practical learning and technology for schools takes collaboration. We list organizations we work with here, with the type of relationship they have with EduAltTech."
          />
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className={wrap}>
          {items.length > 0 ? (
            <div className="space-y-12">
              {groups.map(([type, list]) => (
                <div key={type}>
                  <h2 className="font-display text-xl font-bold text-ink-900">{TYPE_LABEL[type] ?? "Organizations"}</h2>
                  <ul className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {list.map((o) => (
                      <li key={o.id} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-100 bg-white">
                          <CoverImage src={o.logoUrl} alt="" fallback={o.name.slice(0, 2).toUpperCase()} className="object-contain p-2" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-display text-base font-bold text-ink-900">{o.name}</h3>
                          {o.summary && <p className="mt-1 text-sm leading-relaxed text-ink-600">{o.summary}</p>}
                          {o.websiteUrl && (
                            <a
                              href={o.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800"
                            >
                              Visit website
                              <span className="sr-only"> (opens in a new tab)</span>
                              <OpenInNew fontSize="inherit" />
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="max-w-3xl rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 sm:p-12">
              <h2 className="font-display text-xl font-bold text-ink-900">Partners are being listed</h2>
              <p className="mt-3 leading-relaxed text-ink-600">
                We publish organizations only once a relationship is confirmed and cleared for public view.
                If you would like to explore working with EduAltTech, please get in touch.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <LinkButton href="/contact">Contact us</LinkButton>
                <LinkButton href="/services" variant="secondary">
                  Services &amp; Programs
                </LinkButton>
              </div>
            </div>
          )}
        </div>
      </section>

      {items.length > 0 && (
        <section className="bg-slate-50 py-16 sm:py-20">
          <div className={`${wrap} text-center`}>
            <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold text-ink-900">
              Interested in partnering with us?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-ink-600">
              Tell us about your school or organization and the problem you would like to work on.
            </p>
            <div className="mt-8">
              <LinkButton href="/contact" size="lg">
                Get in touch
              </LinkButton>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
