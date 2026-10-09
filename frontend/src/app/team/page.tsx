import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { publicFetch } from "@/lib/server-api";
import SectionHeading from "@/components/landing/SectionHeading";
import CoverImage from "@/components/ui/CoverImage";
import LinkButton from "@/components/ui/LinkButton";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

interface TeamMember {
  id: string;
  name: string;
  title: string;
  bio: string | null;
  avatarUrl: string | null;
  order: number;
}

export const metadata: Metadata = {
  title: "Team",
  description: "The people behind EduAltTech's educational and technology work.",
  alternates: { canonical: "/team" },
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function TeamPage() {
  const team = await publicFetch<{ items: TeamMember[] }>("/cms/public/team");
  const items = team?.items ?? [];

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
                Team
              </li>
            </ol>
          </nav>
          <SectionHeading
            as="h1"
            eyebrow="Our team"
            title="The people behind EduAltTech"
            lead="The educators, builders, and mentors who make our courses and school technology work."
          />
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className={wrap}>
          {items.length > 0 ? (
            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((m) => (
                <li key={m.id} className="flex gap-4">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-100">
                    <CoverImage src={m.avatarUrl} alt={`Portrait of ${m.name}`} fallback={initials(m.name)} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-bold text-ink-900">{m.name}</h2>
                    <p className="text-sm font-medium text-brand-700">{m.title}</p>
                    {m.bio && <p className="mt-2 text-sm leading-relaxed text-ink-600">{m.bio}</p>}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="max-w-3xl rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 sm:p-12">
              <h2 className="font-display text-xl font-bold text-ink-900">Team profiles are being published</h2>
              <p className="mt-3 leading-relaxed text-ink-600">
                We publish team members only with their approval. In the meantime, learn more about what we do
                and who we work with.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <LinkButton href="/about">About EduAltTech</LinkButton>
                <LinkButton href="/contact" variant="secondary">
                  Contact us
                </LinkButton>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-slate-50 py-16 sm:py-20">
        <div className={`${wrap} text-center`}>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold text-ink-900">Want to work with us?</h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-ink-600">
            Explore our courses, see the technology we build, or get in touch.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/courses" size="lg">
              Explore courses
            </LinkButton>
            <LinkButton href="/work" variant="secondary" size="lg">
              Our work
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
