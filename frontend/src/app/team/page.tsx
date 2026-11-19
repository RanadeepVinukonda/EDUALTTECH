import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import SectionHeading from "@/components/landing/SectionHeading";
import TeamShowcase from "@/components/landing/TeamShowcase";
import LinkButton from "@/components/ui/LinkButton";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export const metadata: Metadata = {
  title: "Team",
  description: "The people behind EduAltTech's courses and programs.",
  alternates: { canonical: "/team" },
};

export default function TeamPage() {
  return (
    <div className="bg-paper">
      <section className="border-b border-slate-200 bg-paper-2">
        <div className={`${wrap} py-12 sm:py-16`}>
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
                Team
              </li>
            </ol>
          </nav>
          <SectionHeading
            as="h1"
            title="The people behind EduAltTech"
            lead="The educators, builders, and mentors who make our courses work."
          />
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className={wrap}>
          <TeamShowcase showHeader={false} />
        </div>
      </section>

      <section className="border-t border-slate-200 bg-paper-2 py-12 sm:py-16">
        <div className={wrap}>
          <h2 className="max-w-2xl font-display text-3xl font-semibold text-ink-900">Want to work with us?</h2>
          <p className="mt-4 max-w-xl text-lg text-ink-600">
            Explore our courses or get in touch.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <LinkButton href="/courses" size="lg">
              Explore courses
            </LinkButton>
            <LinkButton href="/contact" variant="secondary" size="lg">
              Contact
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
