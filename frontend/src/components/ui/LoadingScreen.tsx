export default function LoadingScreen({ label = "Loading…", inline = false }: { label?: string; inline?: boolean }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-4 bg-slate-50 ${inline ? "min-h-[40vh] py-16" : "min-h-screen"}`}
    >
      <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-brand-200 border-t-brand-600" aria-hidden="true" />
      <p className="font-display text-sm font-semibold text-ink-700">{label}</p>
      <p className="text-xs font-medium uppercase tracking-widest text-slate-400">EduAltTech</p>
    </div>
  );
}