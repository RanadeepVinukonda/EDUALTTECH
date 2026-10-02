"use client";

export default function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value) || 0));
  return (
    <div
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className="h-2 w-full overflow-hidden rounded-full bg-brand-50"
    >
      <div
        className="h-full rounded-full bg-brand-600 transition-[width] duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
