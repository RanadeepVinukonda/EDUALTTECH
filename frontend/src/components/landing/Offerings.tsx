import Link from "next/link";
import School from "@mui/icons-material/School";
import AutoStories from "@mui/icons-material/AutoStories";
import CoPresent from "@mui/icons-material/CoPresent";
import Apartment from "@mui/icons-material/Apartment";
import ArrowForward from "@mui/icons-material/ArrowForward";
import SectionHeading from "./SectionHeading";

const OFFERINGS = [
  {
    icon: School,
    title: "Education and alternate education",
    body: "Structured courses in AI, entrepreneurship, and applied technology, plus alternate learning for students who need a path beyond the standard syllabus - organised into clear chapters, topics, and lessons.",
    href: "/courses",
    cta: "Browse courses",
  },
  {
    icon: AutoStories,
    title: "Tuition facilities",
    body: "Guided tuition and coaching that sits alongside our courses - subject support, doubt sessions, and hands-on practice, in person and online.",
    href: "/services",
    cta: "See tuition",
  },
  {
    icon: CoPresent,
    title: "Employment for skilled people",
    body: "We recruit skilled people who are out of work, train them as mentors and tutors, and employ them to teach. Teaching with us is real work, not volunteering.",
    href: "/mentor",
    cta: "Teach with us",
  },
  {
    icon: Apartment,
    title: "Technology for schools",
    body: "We build practical digital solutions with and for schools - the same problems our courses teach learners to solve.",
    href: "/services",
    cta: "See school solutions",
  },
];

export default function Offerings() {
  return (
    <section className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What we offer"
          title="Four things EduAltTech does"
          lead="Education for students and work for the people who teach them - the two halves feed each other."
        />

        <div className="mt-12 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
          {OFFERINGS.map((o, i) => (
            <div key={o.title} className="grid gap-6 p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center sm:gap-8 sm:p-8">
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm text-slate-400">{String(i + 1).padStart(2, "0")}</span>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <o.icon />
                </span>
              </div>
              <div>
                <h3 className="font-display text-xl font-bold text-ink-900">{o.title}</h3>
                <p className="mt-2 max-w-2xl text-ink-600">{o.body}</p>
              </div>
              <Link
                href={o.href}
                className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                {o.cta}
                <ArrowForward fontSize="small" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
