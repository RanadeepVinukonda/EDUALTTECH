export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-16 sm:px-6 lg:px-8" aria-hidden>
      <div className="h-6 w-40 rounded bg-slate-200" />
      <div className="mt-6 h-10 w-2/3 rounded bg-slate-200" />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="aspect-[16/10] w-full bg-slate-200" />
            <div className="space-y-3 p-5">
              <div className="h-5 w-2/3 rounded bg-slate-200" />
              <div className="h-4 w-full rounded bg-slate-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
