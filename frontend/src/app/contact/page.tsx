import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import SectionHeading from "@/components/landing/SectionHeading";
import InquiryForm from "@/components/contact/InquiryForm";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with EduAltTech about courses, mentoring, or partnerships.",
  alternates: { canonical: "/contact" },
};

const ENQUIRY_TYPES = [
  "Courses and learning programs",
  "Mentoring a specific course",
  "Technology for your school or organization",
  "Partnerships and collaborations",
];

export default function ContactPage() {
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
                Contact
              </li>
            </ol>
          </nav>
          <SectionHeading
            as="h1"
            eyebrow="Contact"
            title="Get in touch"
            lead="Send us a message and we will respond by email. Whether you are a learner, a prospective mentor, or a school, tell us what you need."
          />
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className={`${wrap} grid gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16`}>
          <div>
            <h2 className="font-display text-xl font-semibold text-ink-900">What we can help with</h2>
            <ul className="mt-4 space-y-3">
              {ENQUIRY_TYPES.map((t) => (
                <li key={t} className="flex items-start gap-3 text-ink-700">
                  <span className="mt-2.5 h-px w-3 shrink-0 bg-slate-300" />
                  {t}
                </li>
              ))}
            </ul>

            <h2 className="mt-10 font-display text-xl font-semibold text-ink-900">Email</h2>
            <a
              href="mailto:info@edualttech.com"
              className="mt-3 inline-flex font-semibold text-brand-700 hover:text-brand-800"
            >
              info@edualttech.com
            </a>

            <p className="mt-8 text-sm leading-relaxed text-slate-500">
              We use the information you submit only to respond to your enquiry. See our{" "}
              <Link href="/privacy" className="font-semibold text-brand-700 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            <InquiryForm />
          </div>
        </div>
      </section>
    </div>
  );
}
