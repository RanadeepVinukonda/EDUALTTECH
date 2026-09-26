export function Loader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16" role="status" aria-label={label ?? "Loading"}>
      <div className="loader-bar">
        <div className="loader-ball" />
      </div>
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  );
}