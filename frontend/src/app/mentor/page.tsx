import Link from "next/link";
import { buttonClass } from "@/components/ui/Button";

export const metadata = {
  title: "Become a Mentor",
  description:
    "Teach on EduAltTech. Learn what mentors do, how applications are reviewed, and how to apply.",
};

const steps = [
  { n: "1", t: "Apply", d: "Submit the application form with your qualification and a resume." },
  { n: "2", t: "Review", d: "Our team reviews your application and may schedule an interview." },
  { n: "3", t: "Decision", d: "You're accepted or not accepted for the course you applied to." },
  { n: "4", t: "Teaching", d: "Accepted mentors are assigned to the course and get a teaching workspace." },
];

const responsibilities = [
  "Author and maintain lessons for your assigned course.",
  "Record or schedule live sessions for enrolled learners.",
  "Keep course material accurate and up to date.",
  "Respond to your learners within the platform.",
];

export default function MentorPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Teach on EduAltTech</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl">
        Become a mentor
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-600">
        Mentors author lessons and run live sessions for the courses they are assigned. If you
        have subject expertise and want to teach, apply for a specific course and our team will
        review your application.
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/dashboard/mentor/apply" className={buttonClass("primary", "lg")}>
          Start an application
        </Link>
        <Link href="/courses" className={buttonClass("secondary", "lg")}>
          Browse courses
        </Link>
      </div>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-extrabold text-ink-900">What mentors do</h2>
        <ul className="mt-4 flex flex-col gap-2 text-slate-700">
          {responsibilities.map((r) => (
            <li key={r} className="flex gap-3">
              <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
              {r}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-extrabold text-ink-900">How the process works</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2">
          {steps.map((s) => (
            <li key={s.n} className="border-t border-slate-200 pt-4">
              <p className="font-mono text-sm text-brand-700">Step {s.n}</p>
              <p className="mt-1 font-display text-lg font-bold text-ink-900">{s.t}</p>
              <p className="mt-1 text-sm text-slate-600">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="font-display text-2xl font-extrabold text-ink-900">What to prepare</h2>
        <ul className="mt-4 flex flex-col gap-2 text-slate-700">
          <li>Choose the course you want to teach.</li>
          <li>Write a qualification summary describing your relevant expertise.</li>
          <li>Have a resume ready (PDF, DOC, DOCX, or TXT — up to 5 MB).</li>
        </ul>
      </section>

      <section className="mt-14 rounded-[20px] border border-slate-200 bg-white p-6">
        <h2 className="font-display text-xl font-extrabold text-ink-900">Applying and tracking status</h2>
        <p className="mt-2 text-slate-600">
          Applying requires an account. After you sign in, you can submit an application and track
          its real status at any time from your mentor dashboard.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dashboard/mentor/apply" className={buttonClass("primary", "sm")}>
            Apply to mentor
          </Link>
          <Link href="/dashboard/mentor" className={buttonClass("ghost", "sm")}>
            View my applications
          </Link>
        </div>
      </section>

      <p className="mt-10 text-sm text-slate-500">
        Submitting an application does not grant teaching access. Mentor access begins only after
        your application is accepted and you are assigned to a course.
      </p>
    </div>
  );
}
