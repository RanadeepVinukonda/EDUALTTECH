import { cn } from "@/lib/cn";

export interface LegalSection {
  id: string;
  heading: string;
  body: React.ReactNode;
}

export default function LegalDocument({
  title,
  intro,
  updated,
  draft,
  sections,
  className,
}: {
  title: string;
  intro?: string;
  updated?: string;
  draft?: string;
  sections: LegalSection[];
  className?: string;
}) {
  return (
    <div className={cn("bg-white", className)}>
      <div className="border-b border-slate-200 bg-paper-2">
        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">{title}</h1>
          {intro && <p className="mt-4 max-w-2xl text-base leading-7 text-ink-600">{intro}</p>}
          {updated && <p className="mt-4 text-sm text-slate-500">Last updated: {updated}</p>}
          {draft && (
            <div role="note" className="mt-6 border-l-2 border-amber-600 bg-paper px-4 py-3 text-sm leading-relaxed text-ink-700">
              {draft}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-16 lg:px-8">
        <nav aria-label="On this page" className="self-start border-b border-slate-200 pb-5 lg:sticky lg:top-24 lg:border-b-0">
          <h2 className="font-display text-sm font-semibold text-ink-900">On this page</h2>
          <ol className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-1">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-ink-600 underline decoration-slate-300 underline-offset-4 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2">
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="max-w-3xl divide-y divide-slate-200">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 py-7 first:pt-0">
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink-900">{s.heading}</h2>
              <div className="mt-3 space-y-4 text-base leading-7 text-ink-700">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
