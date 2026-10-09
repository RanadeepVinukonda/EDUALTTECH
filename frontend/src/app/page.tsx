import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { publicFetch } from "@/lib/server-api";
import type { CourseListItem, WorkItem, ProgramItem, OrganizationItem } from "@/lib/types";
import Hero from "@/components/landing/Hero";
import Offerings from "@/components/landing/Offerings";
import Pathway from "@/components/landing/Pathway";
import SectionHeading from "@/components/landing/SectionHeading";
import CourseCard from "@/components/landing/CourseCard";
import WorkCard from "@/components/landing/WorkCard";
import LinkButton from "@/components/ui/LinkButton";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export default async function HomePage() {
  const [courses, work, programs, partners] = await Promise.all([
    publicFetch<{ items: CourseListItem[] }>("/courses", { limit: 3, sort: "newest" }),
    publicFetch<{ items: WorkItem[] }>("/cms/public/work", { limit: 3 }),
    publicFetch<{ items: ProgramItem[] }>("/cms/public/programs"),
    publicFetch<{ items: OrganizationItem[] }>("/cms/public/organizations"),
  ]);

  const courseItems = courses?.items ?? [];
  const workItems = work?.items ?? [];
  const programItems = programs?.items ?? [];
  const partnerItems = (partners?.items ?? []).filter((o) => o.logoUrl);

  return (
    <>
      <Hero />
      <Offerings />

      {/* Course discovery preview */}
      <section className="bg-white py-16 sm:py-20">
        <div className={wrap}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Courses"
              title="Start with something you can build"
              lead="A sample of published courses. Open the catalogue to see everything available."
            />
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              View all courses
              <ArrowForward fontSize="small" />
            </Link>
          </div>

          {courseItems.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courseItems.map((c) => (
                <CourseCard key={c.id} course={c} />
              ))}
            </div>
          ) : (
            <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center sm:p-12">
              <h3 className="font-display text-xl font-bold text-ink-900">Courses are being published</h3>
              <p className="mx-auto mt-3 max-w-md text-ink-600">
                Our catalogue is being prepared. In the meantime, see the work we do with schools or get
                in touch to hear about upcoming programs.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <LinkButton href="/courses">Open the catalogue</LinkButton>
                <LinkButton href="/contact" variant="secondary">
                  Contact us
                </LinkButton>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Practical work and school solutions */}
      <section className="bg-slate-50 py-16 sm:py-20">
        <div className={wrap}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Our work"
              title="Technology built with schools"
              lead="Delivered projects and solutions, distinct from the learning programs we run."
            />
            <Link
              href="/work"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              See all work
              <ArrowForward fontSize="small" />
            </Link>
          </div>

          {workItems.length > 0 ? (
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {workItems.map((w) => (
                <WorkCard key={w.id} item={w} />
              ))}
            </div>
          ) : (
            <div className="mt-12 max-w-3xl rounded-2xl border border-slate-200 bg-white p-8">
              <p className="text-lg leading-relaxed text-ink-700">
                We design and build practical software for schools — attendance and reporting tools,
                learning portals, and internal systems that reduce administrative load. Each project
                starts from a concrete problem a school is facing.
              </p>
              <Link
                href="/work"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                Read about our work
                <ArrowForward fontSize="small" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Programs and learning philosophy */}
      <section className="bg-white py-16 sm:py-20">
        <div className={wrap}>
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <SectionHeading
              eyebrow="Why it works"
              title="Skills that outlast the syllabus"
              lead="Technology, entrepreneurship, and problem-solving are learned by doing. Our courses are built around practice: read, apply, get feedback, repeat."
            />
            <div className="space-y-6">
              {programItems.length > 0 ? (
                programItems.slice(0, 4).map((p) => (
                  <div key={p.id} className="rounded-2xl border border-slate-200 p-5">
                    <h3 className="font-display text-lg font-bold text-ink-900">{p.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-600">{p.summary}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                  <p className="leading-relaxed text-ink-700">
                    Every program connects a technical skill to a real outcome — a working prototype, a
                    small business, or a tool that solves a problem around you. We do not teach in the
                    abstract, and we avoid claims we cannot back with evidence.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Partners — only rendered when real, logo-backed organizations exist */}
      {partnerItems.length > 0 && (
        <section className="border-y border-slate-200 bg-slate-50 py-12">
          <div className={wrap}>
            <p className="text-center text-sm font-semibold uppercase tracking-wide text-slate-500">
              Schools and organizations we work with
            </p>
            <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-12 gap-y-8">
              {partnerItems.map((o) => (
                <li key={o.id} className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={o.logoUrl!} alt={o.name} className="h-10 w-auto object-contain" />
                  <span className="font-display text-lg font-bold text-ink-800">{o.name}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <Pathway />

      {/* Final call to action */}
      <section className="bg-brand-700 py-16 sm:py-20">
        <div className={`${wrap} text-center`}>
          <h2 className="mx-auto max-w-2xl font-display text-3xl font-bold text-white sm:text-4xl">
            Bring practical technology learning to your learners
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-brand-50">
            Whether you are a student ready to build, or a school looking for a technology partner,
            there is a clear next step.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <LinkButton href="/courses" variant="secondary" size="lg">
              Explore courses
            </LinkButton>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 px-6 py-3.5 text-base font-semibold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
