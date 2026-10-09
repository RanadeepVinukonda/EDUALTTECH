import type { WorkItem } from "@/lib/types";

export default function WorkCard({ item }: { item: WorkItem }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:shadow-elev2">
      <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {item.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.coverUrl} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-slate-500">
            {item.category}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        {item.organization && (
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{item.organization.name}</p>
        )}
        <h3 className="mt-2 font-display text-lg font-bold text-ink-900">{item.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-ink-600">{item.summary}</p>
      </div>
    </article>
  );
}
