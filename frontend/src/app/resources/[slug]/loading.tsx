export default function ResourceArticleLoading() {
  return (
    <div className="min-h-screen bg-paper pb-20" aria-busy="true" aria-label="Loading tutorial">
      <div className="border-b border-rule bg-paper-2">
        <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="h-4 w-56 animate-pulse rounded bg-rule/70" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
          <main className="min-w-0 max-w-[740px] flex-1 space-y-5">
            <div className="h-10 w-4/5 animate-pulse rounded-lg bg-paper-2" />
            <div className="flex gap-3">
              <div className="h-6 w-28 animate-pulse rounded-md bg-paper-2" />
              <div className="h-6 w-20 animate-pulse rounded-md bg-paper-2" />
              <div className="h-6 w-20 animate-pulse rounded-md bg-paper-2" />
            </div>
            <div className="h-5 w-full animate-pulse rounded bg-paper-2" />
            <div className="h-5 w-5/6 animate-pulse rounded bg-paper-2" />

            <div className="space-y-3 border-t border-rule pt-8">
              <div className="h-7 w-1/2 animate-pulse rounded bg-paper-2" />
              <div className="h-4 w-full animate-pulse rounded bg-paper-2" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-paper-2" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-paper-2" />
            </div>

            <div className="space-y-3 pt-4">
              <div className="h-7 w-2/5 animate-pulse rounded bg-paper-2" />
              <div className="h-4 w-full animate-pulse rounded bg-paper-2" />
              <div className="h-4 w-10/12 animate-pulse rounded bg-paper-2" />
            </div>
          </main>

          <aside className="hidden w-64 shrink-0 space-y-3 lg:block">
            <div className="h-5 w-32 animate-pulse rounded bg-paper-2" />
            <div className="h-4 w-48 animate-pulse rounded bg-paper-2" />
            <div className="h-4 w-40 animate-pulse rounded bg-paper-2" />
            <div className="h-4 w-44 animate-pulse rounded bg-paper-2" />
          </aside>
        </div>
      </div>
    </div>
  );
}
