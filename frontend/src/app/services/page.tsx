import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ProgramReveal from "@/components/landing/ProgramReveal";
import LinkButton from "@/components/ui/LinkButton";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export const metadata: Metadata = {
  title: "Services & Programs",
  description:
    "EduAltTech offers structured courses, alternate education, tuition, free open modules, course demand polling, and paid mentoring roles for skilled people.",
  alternates: { canonical: "/services" },
};

interface Service {
  title: string;
  body: string;
  tag: string;
}

const SERVICES: Service[] = [
  {
    title: "Course demand & community polling",
    body: "Learners actively vote on what courses, technologies, and roadmaps we build next. Top-voted proposals are incubated and converted directly into mentor-backed offerings.",
    tag: "Learner-driven",
  },
  {
    title: "Partial employment",
    body: "Skilled people are hired to mentor a specific course — paid work, not volunteering. Access is granted per course after review.",
    tag: "Paid role",
  },
  {
    title: "Mentor support",
    body: "Every mentored course includes asynchronous doubt threads, project feedback, and scheduled doubt-solving sessions, with response expectations set per course.",
    tag: "Included",
  },
  {
    title: "Certificates",
    body: "Finish a course and its projects, and you get a certificate that reflects the work you actually completed.",
    tag: "On completion",
  },
  {
    title: "Tuition",
    body: "Guided tuition and coaching that runs alongside our courses — subject support, doubt sessions, and practice, online and in person.",
    tag: "Alongside courses",
  },
  {
    title: "Free open modules",
    body: "Complete learning modules open to everyone — technology, alternate education, and tuition topics — with no paywall and no login.",
    tag: "Open to all",
  },
];

const PARTNERS = [
  {
    name: "New Era",
    logo: "/media/logos/new_era.jpg",
    photo: "/media/programs/new-era-program.jpeg",
    focus: "AI course & awareness",
    status: "Curriculum merge in progress",
    body: "We run AI classes and awareness sessions with New Era students, and are in the process of merging this program into their curriculum — so AI becomes part of the school's regular learning.",
  },
  {
    name: "Sharada Vidhyalaya",
    logo: "/media/logos/sharada_vidhyalaya.jpeg",
    photo: "/media/programs/sharada-vidhyalaya-program.jpeg",
    focus: "Idea to product development",
    status: "Running in classrooms",
    body: "At Sharada Vidhyalaya we guide students from idea to working product — turning a problem in their world into something they build, test, and present.",
  },
];

const STEPS = [
  {
    title: "Tell us what you need",
    body: "Learner, parent, school, or skilled practitioner — start from the service that matches you.",
  },
  {
    title: "We confirm the fit",
    body: "Every enrolment and mentoring application is reviewed. Nothing is granted automatically.",
  },
  {
    title: "Start learning or earning",
    body: "Work through the roadmap with a mentor, or teach a course and get paid for it.",
  },
];

export default function ServicesPage() {
  return (
    <div className="bg-white">
      {/* Intro */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className={`${wrap} py-10 sm:py-14`}>
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-1.5 text-sm text-ink-600">
              <li>
                <Link href="/" className="transition-colors hover:text-ink-900">
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

          <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl sm:leading-[1.06]">
                Learning, mentorship, and paid work under one roof.
              </h1>
            </div>
            <p className="max-w-md text-base leading-relaxed text-ink-600 lg:col-span-4 lg:pb-2">
              Structured courses and tuition for learners, free open modules for everyone, and paid
              mentoring roles for skilled people — across technology and alternate education.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-slate-200 pt-6 text-xs font-semibold text-slate-600">
            <span>Courses &amp; tuition</span>
            <span aria-hidden className="h-1 w-1 rounded-full bg-slate-300" />
            <span>Free open modules</span>
            <span aria-hidden className="h-1 w-1 rounded-full bg-slate-300" />
            <span>Certificates</span>
            <span aria-hidden className="h-1 w-1 rounded-full bg-slate-300" />
            <span>Paid mentoring</span>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-white py-16 sm:py-24">
        <div className={wrap}>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                Six services, one standard.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ink-600">
              Practical work, real guidance, and a clear outcome — whether you are learning, teaching,
              or running a school program.
            </p>
          </div>

          <ul className="divide-y divide-slate-200">
            {SERVICES.map((s, i) => (
              <li
                key={s.title}
                className="grid gap-3 py-7 sm:grid-cols-12 sm:gap-6 sm:py-8"
              >
                <span className="font-mono text-xs text-slate-400 sm:col-span-1">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-lg font-semibold leading-snug text-ink-900 sm:col-span-4 sm:text-xl">
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed text-ink-600 sm:col-span-5">{s.body}</p>
                <div className="sm:col-span-2 sm:text-right">
                  <span className="text-xs font-medium text-slate-500">{s.tag}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Course Demand & Community Polling Deep Dive */}
      <section id="course-demand" className="border-t border-slate-200 bg-slate-50 py-16 sm:py-24 scroll-mt-12">
        <div className={wrap}>
          <div className="max-w-3xl">
            <h2 className=" font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
              Course Demand &amp; Community Prioritization
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Instead of deciding what you should learn behind closed doors, EduAltTech puts the curriculum roadmap in the hands of learners. Through our community voting cycles, members vote on proposed subjects, new technologies, and multi-disciplinary arts before any course is built.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-7">
              <h3 className="font-display text-lg font-semibold text-ink-900">
                Demand discovery
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Learners propose and evaluate new course concepts — from autonomous AI systems and electronic music production to embedded robotics and academic coaching.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-7">
              <h3 className="font-display text-lg font-semibold text-ink-900">
                One member, one vote
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                To guarantee authenticity and avoid duplicate votes, polling is exclusively available inside member accounts. Every vote transparently impacts real-time demand.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-7">
              <h3 className="font-display text-lg font-semibold text-ink-900">
                Direct course creation
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Winning proposals unlock full development: our team outlines practical roadmaps, structures chapters, and hires industry mentors with paid contracts.
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
            <div>
              <h4 className="font-display text-base sm:text-lg font-semibold text-ink-900">
                Want to participate and vote on upcoming courses?
              </h4>
              <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-xl">
                Course voting is live in the learner workspace. Sign in to your account or create one to cast your vote and influence the next syllabus.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <LinkButton href="/login?next=/polls" variant="secondary" size="sm">
                Sign in to vote
              </LinkButton>
              <LinkButton href="/signup" variant="primary" size="sm">
                Get Started
              </LinkButton>
            </div>
          </div>
        </div>
      </section>

      {/* School partnerships */}
      <section className="border-y border-slate-200 bg-slate-50 py-16 sm:py-24">
        <div className={wrap}>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                Programs running with partner schools.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ink-600">
              Real subjects, real classrooms. Hover or tap a school logo to see the program.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {PARTNERS.map((p) => (
              <article
                key={p.name}
                className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-colors hover:border-brand-300"
              >
                <ProgramReveal logo={p.logo} photo={p.photo} name={p.name} />

                <div className="flex flex-1 flex-col p-7 sm:p-8">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-display text-xl font-semibold text-ink-900">{p.name}</h3>
                    <span className="rounded-md border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
                      {p.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs font-medium text-slate-500">
                    {p.focus}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-ink-600">{p.body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="bg-white py-16 sm:py-24">
        <div className={wrap}>
          <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
                Three steps, whoever you are.
              </h2>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-ink-600">
              Learning, enrolling a student, or teaching — the path is short and nothing is granted
              automatically.
            </p>
          </div>

          <ol className="mt-2 divide-y divide-slate-200">
            {STEPS.map((step, i) => (
              <li key={step.title} className="grid gap-3 py-8 sm:grid-cols-12 sm:gap-6">
                <span className="text-xs font-semibold text-slate-400 sm:col-span-1 sm:pt-1">
                  Step {i + 1}
                </span>
                <h3 className="font-display text-lg font-semibold text-ink-900 sm:col-span-4">{step.title}</h3>
                <p className="text-sm leading-relaxed text-ink-600 sm:col-span-7">{step.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-ink-600">Questions about a program or partnership?</p>
            <LinkButton href="/contact" variant="secondary">
              Contact us
            </LinkButton>
          </div>
        </div>
      </section>
    </div>
  );
}
