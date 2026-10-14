import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import School from "@mui/icons-material/School";
import Groups from "@mui/icons-material/Groups";
import AutoStories from "@mui/icons-material/AutoStories";
import Extension from "@mui/icons-material/Extension";
import Search from "@mui/icons-material/Search";
import Handshake from "@mui/icons-material/Handshake";
import SectionHeading from "@/components/landing/SectionHeading";
import LinkButton from "@/components/ui/LinkButton";
import CoverImage from "@/components/ui/CoverImage";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export const metadata: Metadata = {
  title: "Services & Programs",
  description:
    "EduAltTech offers structured courses, alternate education, and tuition for students — plus paid mentoring roles for skilled people, and digital solutions built with schools.",
  alternates: { canonical: "/services" },
};

const ENGAGEMENT = [
  { icon: Search, step: "Explore", body: "Find the program or service that matches what you need." },
  { icon: Extension, step: "Review", body: "Read the published information before committing to anything." },
  { icon: Handshake, step: "Contact", body: "Get in touch with your requirement or question." },
  { icon: ChevronRight, step: "Proceed", body: "Follow the process that fits — enrolment, application, or a conversation." },
];

const SCHOOL_PROGRAMS = [
  {
    name: "New Era",
    logo: "/media/logos/new_era.jpg",
    photo: "/media/programs/new-era-program.jpeg",
    focus: "AI classes & game development",
    body: "We run hands-on AI classes and game development sessions with students at New Era — practical, project-based learning from the classroom.",
  },
  {
    name: "Sharada Vidhyalaya",
    logo: "/media/logos/sharada_vidhyalaya.jpeg",
    photo: "/media/programs/sharada-vidhyalaya-program.jpeg",
    focus: "Idea & product development",
    body: "At Sharada Vidhyalaya we guide students through idea and product development — turning a problem in their world into something they build and test.",
  },
];

export default function ServicesPage() {
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
            title="Education, tuition, employment, and technology"
            lead="EduAltTech runs structured courses, alternate education, and tuition for students; employs skilled people as paid mentors; and builds digital solutions with schools. Find the fit for you below."
          />
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="#services" variant="secondary">
              School technology
            </LinkButton>
            <LinkButton href="/contact">Talk to us</LinkButton>
          </div>
        </div>
      </section>

      {/* Practical learning and mentorship */}
      <section id="learning" className="scroll-mt-24 bg-slate-50 py-16 sm:py-20">
        <div className={wrap}>
          <SectionHeading
            eyebrow="Learning and mentorship"
            title="Education for students, paid work for mentors"
            lead="Learning and teaching are deliberately distinct. Joining as a learner never grants teaching access — and mentoring is a paid role, not a favour."
          />
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <School />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold text-ink-900">Education &amp; alternate education</h3>
              <p className="mt-2 leading-relaxed text-ink-600">
                Browse the catalogue, open a course, and enrol — free or paid. Learners work through the
                course roadmap at their own pace, with alternate routes where the standard syllabus does
                not fit.
              </p>
              <div className="mt-6">
                <LinkButton href="/courses">Explore courses</LinkButton>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <AutoStories />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold text-ink-900">Tuition facilities</h3>
              <p className="mt-2 leading-relaxed text-ink-600">
                Guided tuition and coaching that runs alongside our courses — subject support, doubt
                sessions, and hands-on practice, in person and online.
              </p>
              <div className="mt-6">
                <LinkButton href="/contact" variant="secondary">
                  Enquire about tuition
                </LinkButton>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-8">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Groups />
              </span>
              <h3 className="mt-4 font-display text-xl font-bold text-ink-900">Employment for skilled people</h3>
              <p className="mt-2 leading-relaxed text-ink-600">
                Skilled but out of work? Apply to mentor a{" "}
                <span className="font-semibold">specific course</span>. Accepted applicants are employed to
                teach it — access is granted per course after review, never as a global account role.
              </p>
              <div className="mt-6">
                <LinkButton href="/mentor" variant="secondary">
                  Apply to mentor
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
                <LinkButton href="/contact">Discuss a requirement</LinkButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Programs run in schools */}
      <section id="in-schools" className="scroll-mt-24 bg-slate-50 py-16 sm:py-20">
        <div className={wrap}>
          <SectionHeading
            eyebrow="In schools"
            title="Programs"
            lead="Alongside our course catalogue, we go into schools and run hands-on programs with students — on real subjects, with real outcomes."
          />
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {SCHOOL_PROGRAMS.map((s) => (
              <div key={s.name} className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="group relative flex h-56 items-center justify-center overflow-hidden border-b border-slate-100 bg-slate-50 p-6">
                  <CoverImage
                    src={s.logo}
                    alt={s.name}
                    fallback={s.name}
                    className="h-full w-full object-contain transition-opacity duration-300 group-hover:opacity-0"
                  />
                  <CoverImage
                    src={s.photo}
                    alt={`${s.name} program`}
                    fallback={s.name}
                    className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-display text-xl font-bold text-ink-900">{s.name}</h3>
                  <p className="mt-1 text-sm font-semibold uppercase tracking-[0.12em] text-brand-700">{s.focus}</p>
                  <p className="mt-3 leading-relaxed text-ink-600">{s.body}</p>
                </div>
              </div>
            ))}
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
    </div>
  );
}
