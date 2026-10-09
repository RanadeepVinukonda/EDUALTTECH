export default function Spinner({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-12 text-slate-500" role="status" aria-live="polite">
      <span
        aria-hidden
        className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent"
      />
      <span className="text-sm">{label}</span>
    </div>
  );
}
