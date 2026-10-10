import Link from "next/link";
import MenuBook from "@mui/icons-material/MenuBook";
import Groups from "@mui/icons-material/Groups";
import School from "@mui/icons-material/School";
import AutoStories from "@mui/icons-material/AutoStories";
import ArrowForward from "@mui/icons-material/ArrowForward";
import SectionHeading from "./SectionHeading";

const OFFERINGS = [
  {
    icon: MenuBook,
    title: "Courses that go beyond the curriculum",
    body: "Structured programs in AI, entrepreneurship, and applied technology — organised into clear chapters, topics, and lessons you work through at your pace.",
    href: "/courses",
    cta: "Browse courses",
  },
  {
    icon: Groups,
    title: "Mentorship and teaching",
    body: "Courses are run by mentors who work through the material with learners. Experienced practitioners can apply to mentor a specific course.",
    href: "/mentor",
    cta: "Apply to mentor",
  },
  {
    icon: School,
    title: "Technology for schools",
    body: "We build practical digital solutions with and for schools — the same problems our courses teach learners to solve.",
    href: "/services",
    cta: "See school solutions",
  },
  {
    icon: AutoStories,
    title: "Resources and skill development",
    body: "Downloadable materials, recorded sessions, and reference content that support hands-on practice long after a lesson ends.",
    href: "/courses",
    cta: "See course resources",
  },
];

export default function Offerings() {
  return (
    <section className="bg-slate-50 py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="What we offer"
          title="Four things EduAltTech does"
          lead="A learning platform and a technology partner — the two halves feed each other."
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
