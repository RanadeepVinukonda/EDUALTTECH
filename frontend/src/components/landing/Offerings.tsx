import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";

const TRACKS = [
  {
    id: "education",
    number: "01",
    title: "Technology & professional education",
    description:
      "Career-focused learning built on structured roadmaps, live code reviews, and industry mentors.",
    tags: ["Applied AI & ML", "Software Engineering", "Tech Entrepreneurship"],
    courseCount: "Structured cohorts",
    href: "/courses?type=EDUCATION",
  },
  {
    id: "alternate",
    number: "02",
    title: "Creative & alternate arts",
    description:
      "Fine arts and performance disciplines taught with the same rigour, feedback, and working mentors.",
    tags: ["Carnatic & Western Music", "Classical Dance", "Creative Production"],
    courseCount: "Masterclasses",
    href: "/courses?type=ALTERNATIVE_EDUCATION",
  },
];

export default function Offerings() {
  return (
    <section className="border-b border-slate-200 bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl lg:col-span-7">
            Education and alternate education, under one roof.
          </h2>
          <p className="text-base leading-relaxed text-slate-600 lg:col-span-5">
            Two tracks with the same standard: a structured curriculum, hands-on projects, and a
            dedicated working mentor.
          </p>
        </div>

        <div className="mt-12 grid border-t border-slate-200 sm:grid-cols-2">
          {TRACKS.map((track) => (
            <div
              key={track.id}
              className="group flex flex-col border-b border-slate-200 py-8 sm:px-8 sm:py-10 sm:first:pl-0 sm:last:border-l sm:last:pr-0"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-mono text-xs text-slate-400">{track.number}</span>
                <span className="text-xs font-medium text-slate-500">{track.courseCount}</span>
              </div>

              <h3 className="mt-8 max-w-sm font-display text-2xl font-semibold leading-snug text-ink-900">
                {track.title}
              </h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">{track.description}</p>

              <ul className="mt-6 space-y-1.5 text-sm text-ink-700">
                {track.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>

              <Link
                href={track.href}
                className="mt-8 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ink-900 transition hover:text-brand-700"
              >
                Browse courses
                <ArrowForward fontSize="inherit" aria-hidden />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
