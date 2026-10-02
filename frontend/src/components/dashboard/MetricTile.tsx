"use client";

import type { ReactNode } from "react";

export default function MetricTile({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-elev2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-slate-500">{label}</p>
        {icon && <span className="shrink-0 text-slate-300">{icon}</span>}
      </div>
      <p className="font-display mt-1.5 text-2xl font-bold text-slate-900 tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
