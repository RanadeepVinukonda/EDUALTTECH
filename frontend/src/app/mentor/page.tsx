import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ArrowForward from "@mui/icons-material/ArrowForward";
import CheckCircle from "@mui/icons-material/CheckCircle";
import LibraryBooks from "@mui/icons-material/LibraryBooks";
import Explore from "@mui/icons-material/Explore";
import Psychology from "@mui/icons-material/Psychology";
import Handshake from "@mui/icons-material/Handshake";
import WorkspacePremium from "@mui/icons-material/WorkspacePremium";

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export const metadata = {
  title: "Become a Mentor",
  description:
    "Turn your skills into paid teaching. Learn what mentors do, how applications are reviewed, and how to apply.",
};

const STEPS = [
  {
    n: "01",
    t: "Apply",
    d: "Submit the application form with your qualification summary and resume for a specific course.",
  },
  {
    n: "02",
    t: "Review",
    d: "Our academic team reviews your expertise and may schedule a brief interview to confirm fit.",
  },
  {
    n: "03",
    t: "Decision",
    d: "You receive a clear acceptance decision for the course you applied to — tracked live in your dashboard.",
  },
  {
    n: "04",
    t: "Teaching",
    d: "Accepted mentors are assigned to the course, receive a dedicated teaching workspace, and get paid to teach.",
  },
];

const RESPONSIBILITIES = [
  {
    title: "Author & maintain lessons",
    body: "Structure practical chapters, exercises, and real-world guidance for your assigned course.",
    Icon: LibraryBooks,
  },
  {
    title: "Run live & recorded sessions",
    body: "Schedule live doubt-solving classes or publish recorded walkthroughs for enrolled learners.",
    Icon: Explore,
  },
  {
    title: "Keep material sharp",
    body: "Keep tools, references, and project briefs accurate and up to date with current practice.",
    Icon: WorkspacePremium,
  },
  {
    title: "Support your learners",
    body: "Answer questions, review student projects, and give direct feedback inside the platform.",
    Icon: Psychology,
  },
];

const CHECKLIST = [
  {
    title: "Pick a course",
    detail: "Choose the specific course from our catalog that matches your strongest craft.",
  },
  {
    title: "Qualification summary",
    detail: "Write a short summary highlighting your hands-on experience and projects.",
  },
  {
    title: "Resume ready",
    detail: "Upload PDF, DOC, DOCX, or TXT (up to 5 MB) when submitting your application.",
  },
];

export default function MentorPage() {
  return (
    <div className="bg-paper">
      {/* Full-Width Solid Brand-Green Split Hero */}
      <section className="border-b border-[#02481f] bg-[#025926] text-white">
        <div className={`${wrap} py-12 sm:py-16`}>
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-sm text-white/80">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-white/55">
                <ChevronRight fontSize="small" />
              </li>
              <li className="font-medium text-white" aria-current="page">
                Become a Mentor
              </li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-12 lg:items-center lg:gap-12">
            {/* Left Pitch */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#024059] px-3.5 py-1 text-xs font-semibold text-white">
                <Handshake sx={{ fontSize: 15 }} aria-hidden />
                <span>Paid Teaching · Partial Employment</span>
              </div>

              <h1 className="mt-4 max-w-2xl font-display text-display-s font-semibold leading-[1.06] tracking-tight text-white">
                Turn your skills into paid teaching.
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
                If you have real skill but no steady work, teaching at EduAltTech is a paid role — not volunteering. Mentors author lessons, review projects, and run live sessions for the courses they are assigned.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/mentor/apply"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#ffffff] px-6 text-sm font-semibold text-[#025926] shadow-sm transition-colors hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-base"
                >
                  Start an application
                  <ArrowForward fontSize="small" aria-hidden />
                </Link>
                <Link
                  href="/courses"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 bg-white/15 px-6 text-sm font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-base"
                >
                  Browse courses to teach
                </Link>
              </div>
            </div>

            {/* Right Readiness Checklist Card (occupies space purposefully) */}
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-white/20 bg-[#ffffff] text-ink shadow-elev3">
                <div className="border-b border-rule bg-paper px-6 py-4">
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                    Before You Apply
                  </p>
                  <h2 className="mt-0.5 font-display text-lg font-semibold text-ink">
                    What to prepare
                  </h2>
                </div>

                <ul className="divide-y divide-rule px-6">
                  {CHECKLIST.map((item) => (
                    <li key={item.title} className="flex items-start gap-3 py-4">
                      <CheckCircle
                        sx={{ fontSize: 18 }}
                        className="mt-0.5 shrink-0 text-[#038c3e]"
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="font-display text-sm font-semibold text-ink">{item.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{item.detail}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-3 border-t border-rule bg-paper-2 px-6 py-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/media/logos/msme-seeklogo.png"
                    alt="MSME Government of India"
                    className="h-9 w-auto shrink-0 object-contain"
                    width={36}
                    height={36}
                  />
                  <div className="min-w-0 text-[11px] leading-snug">
                    <p className="font-semibold text-ink">MSME Registered Enterprise</p>
                    <p className="text-muted">Paid per-course mentor contracts · Govt. of India</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Width 4-Column Responsibilities Grid */}
      <section className="border-b border-rule bg-paper py-12 sm:py-16">
        <div className={wrap}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                Mentor Role
              </p>
              <h2 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                What mentors do
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-ink-2">
              You own the teaching quality for your assigned course — with a dedicated mentor workspace to publish chapters, links, and session schedules.
            </p>
          </div>

          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {RESPONSIBILITIES.map(({ title, body, Icon }) => (
              <li
                key={title}
                className="flex flex-col rounded-2xl border border-rule bg-[#ffffff] p-6 shadow-elev1 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-elev2"
              >
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200 bg-brand-50 text-[#025926]">
                  <Icon fontSize="small" aria-hidden />
                </span>
                <h3 className="mt-5 font-display text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Full-Width 4-Column Connected Process Timeline */}
      <section className="border-b border-rule bg-paper-2 py-12 sm:py-16">
        <div className={wrap}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                Selection Journey
              </p>
              <h2 className="mt-1.5 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                How the process works
              </h2>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-ink-2">
              Every application is reviewed by hand — access is granted per course once you are accepted and assigned.
            </p>
          </div>

          <div className="relative mt-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-10 right-10 top-11 hidden h-px bg-brand-200 lg:block"
            />
            <ol className="relative grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <li
                  key={s.n}
                  className="flex flex-col rounded-2xl border border-rule bg-[#ffffff] p-6 shadow-elev1"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#025926] font-mono text-sm font-bold text-white ring-4 ring-brand-50">
                    {s.n}
                  </span>
                  <h3 className="mt-5 font-display text-lg font-semibold text-ink">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-2">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Full-Width Action & Tracking Status Band */}
      <section className="bg-paper py-12 sm:py-16">
        <div className={wrap}>
          <div className="overflow-hidden rounded-3xl bg-[#024059] p-6 text-white shadow-elev2 sm:p-10">
            <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-brand-300">
                  Live Application Tracking
                </p>
                <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Applying and tracking status
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/85 sm:text-base">
                  Applying requires an account. After you sign in, you can submit your application and track its real status at any time from your mentor dashboard.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-white/70">
                  Note: Submitting an application does not automatically grant teaching access. Mentor access begins only after your application is accepted and you are assigned to a course.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 lg:col-span-4 lg:flex-col lg:items-stretch">
                <Link
                  href="/dashboard/mentor/apply"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#038c3e] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#026b2f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  Apply to mentor
                  <ArrowForward sx={{ fontSize: 16 }} aria-hidden />
                </Link>
                <Link
                  href="/dashboard/mentor"
                  className="inline-flex h-11 items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  View my applications
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
