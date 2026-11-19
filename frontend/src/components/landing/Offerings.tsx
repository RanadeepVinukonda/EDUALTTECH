import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Terminal from "@mui/icons-material/Terminal";
import Palette from "@mui/icons-material/Palette";

const TRACKS = [
  {
    id: "education",
    eyebrow: "Technical track",
    title: "Technology & professional education",
    description: "Structured roadmaps, code review, and practitioner guidance.",
    tags: ["Applied AI & ML", "Software Engineering", "Tech Entrepreneurship"],
    href: "/courses?type=EDUCATION",
    Icon: Terminal,
  },
  {
    id: "alternate",
    eyebrow: "Alternate education",
    title: "Creative & alternate arts",
    description: "Music, dance, and visual arts with practitioner feedback.",
    tags: ["Carnatic & Western Music", "Classical Dance", "Creative Production"],
    href: "/courses?type=ALTERNATIVE_EDUCATION",
    Icon: Palette,
  },
];

export default function Offerings() {
  return (
    <section className="border-b border-rule bg-paper py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          {TRACKS.map(({ id, eyebrow, title, description, tags, href, Icon }) => (
            <Link
              key={id}
              href={href}
              className="group flex flex-col rounded-2xl border border-rule bg-[#ffffff] p-7 shadow-elev1 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-elev2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 sm:p-8"
            >
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-brand-200/80 bg-brand-50 text-brand-700">
                  <Icon fontSize="small" aria-hidden />
                </span>
                <span className="text-[11px] font-mono font-semibold uppercase tracking-[0.12em] text-muted">
                  {eyebrow}
                </span>
              </div>

              <h3 className="mt-5 max-w-md font-display text-2xl font-semibold leading-snug text-ink transition-colors group-hover:text-brand-800">
                {title}
              </h3>
              <p className="mt-2.5 max-w-md text-sm leading-relaxed text-ink-2">{description}</p>

              <ul className="mt-6 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full border border-rule bg-paper-2 px-3 py-1 text-xs font-medium text-ink-2"
                  >
                    {tag}
                  </li>
                ))}
              </ul>

              <span className="mt-8 inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-brand-700 transition-colors group-hover:text-brand-800">
                Browse courses
                <ArrowForward
                  fontSize="inherit"
                  aria-hidden
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
