import Link from "next/link";
import LinkButton from "@/components/ui/LinkButton";
import SectionHeading from "./SectionHeading";

export default function Pathway() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Get involved"
          title="Learn as a student, or earn as a mentor"
          lead="Two clear paths. Mentoring is a paid role granted per course after review — never as a global account role."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8">
            <h3 className="font-display text-2xl font-bold text-ink-900">Learn as a student</h3>
            <ol className="mt-6 space-y-4">
              {[
                "Create an account and verify your email.",
                "Browse the catalogue and open a course to see its roadmap.",
                "Enrol — free or paid — and start at your own pace.",
                "Work through lessons with your course mentors.",
              ].map((step, i) => (
                <li key={step} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="text-ink-700">{step}</span>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href="/signup">Get started</LinkButton>
              <LinkButton href="/courses" variant="secondary">
                Explore courses
              </LinkButton>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-ink-900 p-8 text-slate-200">
            <h3 className="font-display text-2xl font-bold text-white">Teach and earn with us</h3>
            <p className="mt-4 leading-relaxed text-slate-300">
              If you have real skill but no steady work, teaching here is a paid role. Apply for a
              specific course; our team reviews each application, and accepted mentors are employed to
              teach that course only.
            </p>
            <ul className="mt-6 space-y-3 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                Apply with your qualification and a short note.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                Applications move through review; we may schedule a short interview.
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                Accepted mentors get paid authoring and session tools for their course.
              </li>
            </ul>
            <div className="mt-8">
              <Link
                href="/mentor"
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-[15px] font-semibold text-ink-900 transition hover:bg-slate-100"
              >
                Apply to mentor
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
