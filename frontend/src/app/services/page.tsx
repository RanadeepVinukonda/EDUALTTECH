import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ArrowForward from "@mui/icons-material/ArrowForward";
import HowToVote from "@mui/icons-material/HowToVote";
import Handshake from "@mui/icons-material/Handshake";
import Psychology from "@mui/icons-material/Psychology";
import WorkspacePremium from "@mui/icons-material/WorkspacePremium";
import Explore from "@mui/icons-material/Explore";
import LibraryBooks from "@mui/icons-material/LibraryBooks";
import Lightbulb from "@mui/icons-material/Lightbulb";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ProgramReveal from "@/components/landing/ProgramReveal";
import LinkButton from "@/components/ui/LinkButton";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export const metadata: Metadata = {
  title: "Services & Programs",
  description:
    "EduAltTech offers structured courses, alternate education, tuition, free open modules, course demand polling, and paid mentoring roles for skilled people.",
  alternates: { canonical: "/services" },
};

const INTRO_HIGHLIGHTS = [
  "Courses & tuition",
  "Free open modules",
  "MSME Approved Certificates",
  "Paid mentoring",
];

const AUDIENCES = [
  {
    label: "For Learners",
    detail: "Mentor-led courses, MSME certificates & free open notes",
    href: "/courses",
  },
  {
    label: "For Mentors",
    detail: "Paid per-course teaching roles after review",
    href: "/mentor",
  },
  {
    label: "For Schools",
    detail: "In-classroom AI & product-building curriculum programs",
    href: "#school-programs",
  },
];

const SERVICES = [
  {
    title: "Course demand & community polling",
    body: "Learners actively vote on what courses, technologies, and roadmaps we build next. Top-voted proposals are incubated and converted directly into mentor-backed offerings.",
    tag: "Learner-driven",
    Icon: HowToVote,
    href: "/polls",
    cta: "Vote on courses",
  },
  {
    title: "Partial employment",
    body: "Skilled people are hired to mentor a specific course — a paid role rather than volunteering. Access is granted per course after review.",
    tag: "Paid role",
    Icon: Handshake,
    href: "/mentor",
    cta: "Apply to mentor",
  },
  {
    title: "Mentor support",
    body: "Every mentored course includes asynchronous doubt threads, project feedback, and scheduled doubt-solving sessions, with response expectations set per course.",
    tag: "Included",
    Icon: Psychology,
    href: "/courses",
    cta: "Explore courses",
  },
  {
    title: "Certificates",
    body: "Finish a course and its projects to earn an MSME Approved certificate from a Govt. of India registered enterprise reflecting the real work you completed.",
    tag: "MSME Approved",
    Icon: WorkspacePremium,
    msme: true,
    href: "/courses",
    cta: "View certified courses",
  },
  {
    title: "Tuition",
    body: "Guided tuition and coaching runs alongside our courses, with subject support, doubt sessions, and structured practice online and in person.",
    tag: "Alongside courses",
    Icon: Explore,
    href: "/contact",
    cta: "Enquire about tuition",
  },
  {
    title: "Free open modules",
    body: "Complete learning modules open to everyone, covering technology, alternate education, and tuition topics with no paywall or login required.",
    tag: "Open to all",
    Icon: LibraryBooks,
    href: "/resources",
    cta: "Browse free modules",
  },
];

const DEMAND_PILLARS = [
  {
    title: "Demand discovery",
    body: "Learners propose and evaluate new course concepts, from autonomous AI systems and electronic music production to embedded robotics and academic coaching.",
    Icon: Lightbulb,
  },
  {
    title: "One member, one vote",
    body: "To guarantee authenticity and avoid duplicate votes, polling is exclusively available inside member accounts. Every vote transparently impacts real-time demand.",
    Icon: CheckCircle,
  },
  {
    title: "Direct course creation",
    body: "Winning proposals move into development. Our team outlines practical roadmaps, structures chapters, and hires industry mentors with paid contracts.",
    Icon: WorkspacePremium,
  },
];

const PARTNERS = [
  {
    name: "New Era",
    logo: "/media/logos/new_era.png",
    photo: "/media/programs/new-era-program.jpeg",
    focus: "AI course & awareness",
    status: "Curriculum merge in progress",
    body: "We run AI classes and awareness sessions with New Era students, and are in the process of merging this program into their curriculum so AI becomes part of the school's regular learning.",
  },
  {
    name: "Sharada Vidhyalaya",
    logo: "/media/logos/sharada_vidhyalaya.png",
    photo: "/media/programs/sharada-vidhyalaya-program.jpeg",
    focus: "Idea to product development",
    status: "Running in classrooms",
    body: "At Sharada Vidhyalaya, we guide students from idea to working product. They turn a problem in their world into something they build, test, and present.",
  },
];

const STEPS = [
  {
    title: "Tell us what you need",
    body: "Learner, parent, school, or skilled practitioner — start from the service or program that matches your goals.",
  },
  {
    title: "We confirm the fit",
    body: "Every enrolment and mentoring application is reviewed carefully so learners and mentors get the right cohort.",
  },
  {
    title: "Start learning or earning",
    body: "Work through structured roadmaps with a dedicated mentor, or teach a course and get paid for it.",
  },
];

export default function ServicesPage() {
  return (
    <div className="bg-paper">
      {/* Intro */}
      <section className="relative overflow-hidden border-b border-rule bg-paper-2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(3,140,62,0.09),transparent_52%)]"
        />
        <div className={`${wrap} relative py-12 sm:py-16 lg:py-20`}>
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-sm text-muted">
              <li>
                <Link href="/" className="transition-colors hover:text-ink">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-muted/70">
                <ChevronRight fontSize="small" />
              </li>
              <li className="font-medium text-ink" aria-current="page">
                Services &amp; Programs
              </li>
            </ol>
          </nav>

          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.12em] text-brand-700">
                Services &amp; Programs
              </p>
              <h1 className="mt-2.5 max-w-[16ch] font-display text-display-s font-semibold leading-[1.06] tracking-tight text-ink">
                Learning, mentorship and paid work.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
                Learn through practical mentor-led courses and free open modules, run programs inside partner schools, or get paid to mentor what you know best.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <LinkButton href="/courses" variant="primary" size="lg">
                  Explore courses
                  <ArrowForward fontSize="small" aria-hidden />
                </LinkButton>
                <LinkButton href="/mentor" variant="secondary" size="lg">
                  Apply to mentor
                </LinkButton>
              </div>

              <ul className="mt-8 flex flex-wrap items-center gap-2">
                {INTRO_HIGHLIGHTS.map((item) => (
                  <li
                    key={item}
                    className="rounded-full border border-rule bg-[#ffffff] px-3.5 py-1.5 text-xs font-semibold text-ink-2 shadow-elev1"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Right Gateway & MSME Prestige Panel */}
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-rule bg-[#ffffff] shadow-elev2">
                <div className="border-b border-rule bg-paper/60 p-5 sm:p-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-brand-100 bg-[#ffffff] p-2 shadow-elev1 sm:h-24 sm:w-24">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/media/logos/msme-seeklogo.png"
                        alt="Ministry of MSME, Government of India"
                        className="h-full w-full object-contain"
                        width={80}
                        height={80}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10.5px] font-mono font-semibold uppercase tracking-[0.1em] text-brand-700">
                        Govt. of India Registered
                      </p>
                      <p className="font-display text-base font-semibold text-ink">
                        MSME Approved Enterprise
                      </p>
                      <p className="text-xs text-muted">Verified certificates &amp; school programs</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-rule">
                  {AUDIENCES.map((item) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-paper-2/70 sm:px-6"
                    >
                      <div className="min-w-0">
                        <div className="font-display text-sm font-semibold text-ink group-hover:text-brand-800">
                          {item.label}
                        </div>
                        <p className="mt-0.5 text-xs text-ink-2">{item.detail}</p>
                      </div>
                      <ArrowForward
                        sx={{ fontSize: 16 }}
                        aria-hidden
                        className="shrink-0 text-muted transition-all group-hover:translate-x-0.5 group-hover:text-brand-700"
                      />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="border-b border-rule bg-paper py-14 sm:py-16">
        <div className={wrap}>
          <div className="flex flex-col gap-4 border-b border-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.12em] text-brand-700">
                What we offer
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Six services, one standard.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ink-2">
              Practical work, real guidance, and a clear outcome — whether you are learning, teaching,
              or running a school program.
            </p>
          </div>

          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ title, body, tag, Icon, msme, href, cta }, i) => (
              <li
                key={title}
                className={`group flex flex-col rounded-2xl border bg-[#ffffff] p-6 shadow-elev1 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-elev2 sm:p-7 ${
                  msme ? "border-brand-300/90" : "border-rule"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200/80 bg-gradient-to-br from-brand-50 to-brand-100/70 text-brand-700">
                    <Icon fontSize="small" aria-hidden />
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                        msme
                          ? "border-brand-200 bg-brand-50 text-brand-800"
                          : "border-rule bg-paper-2 text-ink-2"
                      }`}
                    >
                      {tag}
                    </span>
                    <span className="font-mono text-xs font-semibold text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                </div>

                <h3 className="mt-5 font-display text-lg font-semibold leading-snug text-ink sm:text-xl">
                  {title}
                </h3>
                <p className="mt-2.5 flex-1 text-sm leading-relaxed text-ink-2">{body}</p>

                {msme && (
                  <div className="mt-4 inline-flex w-fit items-center gap-2.5 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-semibold text-brand-900">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/media/logos/msme-seeklogo.png"
                      alt="MSME Government of India"
                      className="h-6 w-auto shrink-0 object-contain"
                      width={24}
                      height={24}
                    />
                    <span>Govt. of India Registered Enterprise</span>
                  </div>
                )}

                <div className="mt-5 border-t border-rule/70 pt-4">
                  <Link
                    href={href}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 transition-colors hover:text-brand-800"
                  >
                    {cta}
                    <ArrowForward
                      sx={{ fontSize: 14 }}
                      aria-hidden
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Course Demand & Community Polling Deep Dive */}
      <section id="course-demand" className="scroll-mt-12 border-b border-rule bg-paper-2 py-14 sm:py-16">
        <div className={wrap}>
          <div className="max-w-3xl">
            <p className="text-xs font-mono font-semibold uppercase tracking-[0.12em] text-brand-700">
              Learner-led roadmap
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              Course Demand &amp; Community Prioritization
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink-2">
              Instead of deciding what you should learn behind closed doors, EduAltTech puts the curriculum roadmap in the hands of learners. Through our community voting cycles, members vote on proposed subjects, new technologies, and multi-disciplinary arts before any course is built.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {DEMAND_PILLARS.map(({ title, body, Icon }, i) => (
              <div
                key={title}
                className="rounded-2xl border border-rule bg-[#ffffff] p-6 shadow-elev1 transition-all duration-200 hover:border-brand-300 hover:shadow-elev2 sm:p-7"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-brand-200/80 bg-brand-50 text-brand-700">
                    <Icon fontSize="small" aria-hidden />
                  </span>
                  <span className="font-mono text-xs font-semibold text-muted">
                    Stage {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-5 rounded-2xl bg-brand-900 p-6 text-white shadow-elev2 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h3 className="font-display text-lg font-semibold text-white sm:text-xl">
                Want to participate and vote on upcoming courses?
              </h3>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-brand-100/85">
                Course voting is live in the learner workspace. Sign in to your account or create one to cast your vote and shape the next syllabus.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-3">
              <Link
                href="/login?next=/polls"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-white/25 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Sign in to vote
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-[#ffffff] px-4 text-sm font-semibold text-brand-900 shadow-sm transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Get Started
                <ArrowForward sx={{ fontSize: 16 }} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* School partnerships */}
      <section id="school-programs" className="scroll-mt-12 border-b border-rule bg-paper py-14 sm:py-16">
        <div className={wrap}>
          <div className="flex flex-col gap-4 border-b border-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.12em] text-brand-700">
                In-school programs
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Programs running with partner schools.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ink-2">
              Real subjects, real classrooms. Hover or tap a school logo to reveal classroom photos from the program.
            </p>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-2">
            {PARTNERS.map((p) => (
              <article
                key={p.name}
                className="group flex flex-col overflow-hidden rounded-2xl border border-rule bg-[#ffffff] shadow-elev1 transition-all duration-200 hover:border-brand-300 hover:shadow-elev2"
              >
                <ProgramReveal logo={p.logo} photo={p.photo} name={p.name} />

                <div className="flex flex-1 flex-col p-6 sm:p-7">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-xl font-semibold text-ink">{p.name}</h3>
                    <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-0.5 text-xs font-semibold text-brand-800">
                      {p.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                    {p.focus}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-ink-2">{p.body}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-8 flex justify-end">
            <Link
              href="/partners"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors hover:text-brand-800"
            >
              View all partner schools and institutions
              <ArrowForward fontSize="inherit" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="bg-paper-2 py-14 sm:py-16">
        <div className={wrap}>
          <div className="flex flex-col gap-4 border-b border-rule pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.12em] text-brand-700">
                How to get started
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                Three steps, whoever you are.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ink-2">
              Learning, enrolling a student, or teaching. The path is short, and every application is reviewed.
            </p>
          </div>

          <div className="relative mt-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-10 right-10 top-11 hidden h-px bg-brand-200 md:block"
            />
            <ol className="relative grid gap-6 md:grid-cols-3">
              {STEPS.map((step, i) => (
                <li
                  key={step.title}
                  className="flex flex-col rounded-2xl border border-rule bg-[#ffffff] p-6 shadow-elev1 sm:p-7"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 font-mono text-sm font-semibold text-white shadow-sm ring-4 ring-brand-50">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-rule bg-[#ffffff] p-6 shadow-elev1 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">
                Questions about a program or school partnership?
              </h3>
              <p className="mt-1 text-sm text-ink-2">
                Reach out to our team for school curriculum merges, group cohorts, or mentor onboarding.
              </p>
            </div>
            <LinkButton href="/contact" variant="primary" size="md" className="shrink-0">
              Contact us
              <ArrowForward fontSize="small" aria-hidden />
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
