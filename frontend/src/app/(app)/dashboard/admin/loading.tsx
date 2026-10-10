import Skeleton from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6" aria-hidden>
      <Skeleton className="h-7 w-56" />
      <div className="mt-6 flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-28" />
        ))}
      </div>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
        <Skeleton className="h-11 w-full rounded-none" />
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-none border-t border-slate-100" />
        ))}
      </div>
    </div>
  );
}
