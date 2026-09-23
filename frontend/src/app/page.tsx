import Link from "next/link";

const CAPABILITIES = [
  {
    title: "Digital Classrooms",
    body: "Lessons, assignments and progress tracking teachers can run from day one.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6" aria-hidden="true">
        <path d="M2.5 12s3.5-5 9.5-5 9.5 5 9.5 5-3.5 5-9.5 5-9.5-5-9.5-5Z" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    ),
  },
  {
    title: "School Administration",
    body: "Admissions, records and timetables out of paper registers into one system.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6" aria-hidden="true">
        <path d="M8 2h8v20H8zM12 6h4M12 10h4M12 14h4" />
      </svg>
    ),
  },
  {
    title: "Parent Communication",
    body: "Notices and reports that reach every parent, in the language they speak.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
    ),
  },
  {
    title: "Learning Analytics",
    body: "See which lessons work and which students need help, before the term ends.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-6 w-6" aria-hidden="true">
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    ),
  },
];

const IMPACT = [
  { value: "11+", label: "Partner schools" },
  { value: "1000+", label: "Students reached" },
  { value: "100+", label: "Study resources" },
  { value: "98%", label: "Satisfaction rate" },
];

const STUDENT_FEATURES = [
  "Structured courses with modules, lessons & quizzes",
  "Practice zone with attempt history & streaks",
  "Built-in AI tutor with saved chat history",
  "100+ downloadable study resources",
  "Personal dashboard with learning analytics",
];

const TEACHER_FEATURES = [
  "Simple application flow to join",
  "Teacher panel for courses & classroom chats",
  "Notify students and track class activity",
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-m3-surface to-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28">
          <p className="mb-4 inline-block rounded-full border border-brand-200 bg-white px-4 py-1 text-sm font-medium text-brand-700 shadow-soft">
            Built with 11+ partner schools
          </p>
          <h1 className="font-display max-w-3xl text-4xl font-bold leading-tight text-ink-700 sm:text-5xl lg:text-6xl">
            Technology for schools that students actually use.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-slate-600">
            Edu-Alt-Tech builds digital classrooms, learning apps and school tools{" "}
            <strong>together with</strong> real partner schools — students learn on it, teachers
            teach on it, and schools run on it. Every tool is tested with the people who use it
            daily before it ships.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white shadow-elev1 hover:bg-brand-700"
            >
              Start learning free
            </Link>
            <Link
              href="/contact"
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:border-brand-400 hover:text-brand-700"
            >
              Bring it to your school
            </Link>
          </div>
        </div>
      </section>

      {/* Impact */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
          {IMPACT.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-4xl font-bold text-brand-700">{s.value}</p>
              <p className="mt-1 text-sm text-slate-600">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="pb-10 text-center text-sm text-slate-500">
          Digital classrooms live in 4 partner schools this semester.
        </p>
      </section>

      {/* Capabilities */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-bold text-ink-700">What we offer schools</h2>
        <p className="mt-3 max-w-2xl text-slate-600">
          Four capabilities, one platform — designed around real campuses and real problems.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {CAPABILITIES.map((c) => (
            <div
              key={c.title}
              className="rounded-lg border border-slate-200 bg-white p-6 shadow-elev1 hover:border-brand-300 hover:shadow-elev2"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-md bg-m3-surface text-brand-700">
                {c.icon}
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold text-slate-900">{c.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Students / Teachers split */}
      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-elev1">
            <h3 className="font-display text-2xl font-bold text-ink-700">For students</h3>
            <ul className="mt-6 space-y-3">
              {STUDENT_FEATURES.map((f) => (
                <li key={f} className="flex gap-3 text-slate-700">
                  <span className="mt-1 h-2 w-2 flex-none rounded-full bg-brand-500" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/register" className="mt-8 inline-block font-semibold text-brand-700 hover:text-brand-800">
              Create a free account →
            </Link>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-elev1">
            <h3 className="font-display text-2xl font-bold text-ink-700">For teachers</h3>
            <ul className="mt-6 space-y-3">
              {TEACHER_FEATURES.map((f) => (
                <li key={f} className="flex gap-3 text-slate-700">
                  <span className="mt-1 h-2 w-2 flex-none rounded-full bg-brand-500" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/teachers/apply" className="mt-8 inline-block font-semibold text-brand-700 hover:text-brand-800">
              Apply to teach →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-ink-800">
        <div className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold text-white">
            Ready to run your school on it?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-ink-200">
            Tell us about your campus and we&apos;ll set up a pilot — real classrooms, real
            feedback, from day one.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-block rounded-lg bg-brand-500 px-6 py-3 font-semibold text-white shadow-elev2 hover:bg-brand-600"
          >
            Talk to the team
          </Link>
        </div>
      </section>
    </div>
  );
}