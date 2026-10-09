import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import School from "@mui/icons-material/School";
import Groups from "@mui/icons-material/Groups";
import Extension from "@mui/icons-material/Extension";
import Search from "@mui/icons-material/Search";
import Handshake from "@mui/icons-material/Handshake";
import { publicFetch } from "@/lib/server-api";
import type { ProgramItem, WorkItem } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import SectionHeading from "@/components/landing/SectionHeading";
import WorkCard from "@/components/landing/WorkCard";
import CoverImage from "@/components/ui/CoverImage";
import LinkButton from "@/components/ui/LinkButton";
import InquiryForm from "@/components/contact/InquiryForm";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export const metadata: Metadata = {
  title: "Services & Programs",
  description:
    "EduAltTech offers practical educational programs and digital solutions for schools — structured learning with mentors, and technology built with schools.",
  alternates: { canonical: "/services" },
};

const ENGAGEMENT = [
  { icon: Search, step: "Explore", body: "Find the program or service that matches what you need." },
  { icon: Extension, step: "Review", body: "Read the published information before committing to anything." },
  { icon: Handshake, step: "Contact", body: "Get in touch with your requirement or question." },
  { icon: ChevronRight, step: "Proceed", body: "Follow the process that fits — enrolment, application, or a conversation." },
];

export default async function ServicesPage() {
  const [programs, work] = await Promise.all([
    publicFetch<{ items: ProgramItem[] }>("/cms/public/programs"),
    publicFetch<{ items: WorkItem[] }>("/cms/public/work", { limit: 3 }),
  ]);

  const programItems = programs?.items ?? [];
  const workItems = work?.items ?? [];

  return (
    <div className="bg-white">
      {/* Intro */}
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
                Services &amp; Programs
              </li>
            </ol>
          </nav>
          <SectionHeading
            as="h1"
            eyebrow="Services & Programs"
            title="Practical education and technology solutions"
            lead="EduAltTech offers two kinds of engagement: structured educational programs for learners, and digital solutions built with schools. Find the one that fits you below."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="#programs" variant="secondary">
              Educational programs
            </LinkButton>
            <LinkButton href="#services" variant="secondary">
              School technology
            </LinkButton>
            <LinkButton href="#enquiry">Talk to us</LinkButton>
          </div>
        </div>
      </section>

      {/* Educational programs */}
      <section id="programs" className="scroll-mt-24 py-16 sm:py-20">
        <div className={wrap}>
          <SectionHeading
            eyebrow="Educational programs"
            title="Programs and learning initiatives"
            lead="Structured learning we run with schools and learners. Programs are published here as they are confirmed."
          />

          {programItems.length > 0 ? (
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {programItems.map((p) => (
                <li key={p.id} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100">
                    <CoverImage src={p.coverUrl} alt="" fallback={p.organization?.name ?? "Program"} />
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    {p.organization && (
                      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
                        {p.organization.name}
                      </p>
                    )}
                    <h3 className="mt-2 font-display text-lg font-bold text-ink-900">{p.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{p.summary}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                      {typeof p.pricePaise === "number" && p.pricePaise > 0 ? (
                        <span className="font-semibold text-ink-900">{formatPrice(p.pricePaise, p.currency)}</span>
                      ) : (
                        <span className="text-sm text-slate-500">Price on inquiry</span>
                      )}
                      <a href="#enquiry" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                        Enquire
                      </a>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-12 max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-8">
              <p className="text-lg leading-relaxed text-ink-700">
                Program details are published as they are confirmed. In the meantime, our course catalogue is
                open, and you can reach us directly with a specific requirement.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <LinkButton href="/courses">Browse courses</LinkButton>
                <LinkButton href="#enquiry" variant="secondary">
                  Contact us
                </LinkButton>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Practical learning and mentorship */}
      <section id="learning" className="scroll-mt-24 bg-slate-50 py-16 sm:py-20">
        <div className={wrap}>
          <SectionHeading
            eyebrow="Learning and mentorship"
            title="Two separate paths"
            lead="Learning and teaching are deliberately distinct. Joining as a learner never grants teaching access."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <School />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold text-ink-900">Join as a learner</h3>
              <p className="mt-2 leading-relaxed text-ink-600">
                Browse the catalogue, open a course, and enrol — free or paid. Learners work through the
                course roadmap at their own pace with mentors on hand.
              </p>
              <div className="mt-6">
                <LinkButton href="/courses">Explore courses</LinkButton>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Groups />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold text-ink-900">Apply to mentor</h3>
              <p className="mt-2 leading-relaxed text-ink-600">
                Experienced practitioners apply to mentor a <span className="font-semibold">specific course</span>.
                Applications are reviewed, and mentoring is granted per course only after approval — never as a
                global account role.
              </p>
              <div className="mt-6">
                <LinkButton href="/courses" variant="secondary">
                  Browse courses to mentor
                </LinkButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* School technology */}
      <section id="services" className="scroll-mt-24 py-16 sm:py-20">
        <div className={wrap}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
            <SectionHeading
              eyebrow="Technology for schools"
              title="Digital solutions for schools"
              lead="We design and build practical software that supports how a school actually operates — starting from a concrete problem, not a generic product."
            />
            <div className="max-w-prose space-y-5 text-lg leading-relaxed text-ink-700">
              <p>
                Our school work covers areas such as learning platforms and school-specific applications that
                reduce administrative load. Each engagement begins with understanding the school&apos;s situation
                before any technology is chosen.
              </p>
              <p>
                We share details of delivered work only when the record supports it — no promises of
                integrations, timelines, or support commitments beyond what has been agreed.
              </p>
              <div className="pt-2">
                <LinkButton href="#enquiry">Discuss a requirement</LinkButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How engagement works */}
      <section id="process" className="scroll-mt-24 bg-slate-50 py-16 sm:py-20">
        <div className={wrap}>
          <SectionHeading
            eyebrow="How it works"
            title="A simple, honest process"
            lead="No step here automatically creates a project, enrols a learner, or guarantees acceptance."
          />
          <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ENGAGEMENT.map((s, i) => (
              <li key={s.step} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-slate-400">{String(i + 1).padStart(2, "0")}</span>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                    <s.icon fontSize="small" />
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold text-ink-900">{s.step}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Relevant work */}
      <section id="work" className="scroll-mt-24 py-16 sm:py-20">
        <div className={wrap}>
          <SectionHeading
            eyebrow="Relevant work"
            title="A few things we have built"
            lead="A limited selection of published projects. See the Our Work page for the full picture."
          />
          {workItems.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {workItems.map((w) => (
                <WorkCard key={w.id} item={w} />
              ))}
            </div>
          ) : (
            <div className="mt-12 max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-8">
              <p className="text-lg leading-relaxed text-ink-700">
                We publish projects once they are confirmed and cleared for public view. Reach out to hear
                about recent work relevant to your school.
              </p>
              <div className="mt-6">
                <LinkButton href="#enquiry" variant="secondary">
                  Ask about our work
                </LinkButton>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Audience CTAs */}
      <section className="bg-ink-900 py-16 text-slate-200 sm:py-20">
        <div className={wrap}>
          <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Choose your next step</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { title: "Learners", body: "Discover courses built around practical skill.", href: "/courses", cta: "Explore courses" },
              { title: "Prospective mentors", body: "Browse courses and apply for a specific one.", href: "/courses", cta: "Browse courses" },
              { title: "Schools & organizations", body: "Tell us your requirement and start a conversation.", href: "#enquiry", cta: "Contact us" },
              { title: "Program participants", body: "Open the published program that fits you.", href: "#programs", cta: "View programs" },
            ].map((c) => (
              <div key={c.title} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                <h3 className="font-display text-lg font-bold text-white">{c.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-300">{c.body}</p>
                <Link
                  href={c.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-500 hover:text-white"
                >
                  {c.cta}
                  <ChevronRight fontSize="small" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact conversion */}
      <section id="enquiry" className="scroll-mt-24 bg-slate-50 py-16 sm:py-20">
        <div className={wrap}>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
            <SectionHeading
              eyebrow="Contact"
              title="Tell us what you need"
              lead="Send us a message and we will respond by email. This does not create a project or enrol anyone — it starts a conversation."
            />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
              <InquiryForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
