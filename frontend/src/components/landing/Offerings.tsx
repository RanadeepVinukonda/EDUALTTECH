import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";

const TRACKS = [
  {
    id: "education",
    title: "Technology & professional education",
    description: "Roadmaps, code review, and practitioner guidance.",
    tags: ["Applied AI & ML", "Software Engineering", "Tech Entrepreneurship"],
    href: "/courses?type=EDUCATION",
  },
  {
    id: "alternate",
    title: "Creative & alternate arts",
    description: "Music, dance, and visual arts with practitioner feedback.",
    tags: ["Carnatic & Western Music", "Classical Dance", "Creative Production"],
    href: "/courses?type=ALTERNATIVE_EDUCATION",
  },
];

export default function Offerings() {
  return (
    <section className="border-b border-slate-200 bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid border-t border-slate-200 sm:grid-cols-2">
          {TRACKS.map((track) => (
            <div
              key={track.id}
              className="group flex flex-col border-b border-slate-200 py-6 sm:px-8 sm:py-8 sm:first:pl-0 sm:last:border-l sm:last:pr-0"
            >
              <h3 className="max-w-sm font-display text-2xl font-semibold leading-snug text-ink-900">
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
