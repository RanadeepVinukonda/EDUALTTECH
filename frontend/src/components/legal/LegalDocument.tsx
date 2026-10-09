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
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">{title}</h1>
          {intro && <p className="mt-4 max-w-2xl leading-relaxed text-ink-600">{intro}</p>}
          {updated && <p className="mt-4 text-sm text-slate-500">Last updated: {updated}</p>}
          {draft && (
            <div role="note" className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {draft}
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <nav aria-label="On this page" className="mb-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-ink-900">On this page</h2>
          <ol className="mt-3 space-y-1.5 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-brand-700 hover:text-brand-800 hover:underline">
                  {s.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="font-display text-xl font-bold text-ink-900">{s.heading}</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-ink-700">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
