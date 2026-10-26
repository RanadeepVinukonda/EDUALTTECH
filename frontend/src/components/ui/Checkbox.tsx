"use client";

import { cn } from "@/lib/cn";

export default function Checkbox({
  checked,
  onChange,
  disabled,
  className,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <span className={cn("relative inline-flex h-6 w-6 shrink-0 items-center justify-center", className)}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
        className="absolute inset-0 h-full w-full cursor-pointer appearance-none rounded-md border border-slate-300 bg-white transition-colors checked:border-brand-600 checked:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
      />
      <svg
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="pointer-events-none relative h-4 w-4 text-white"
      >
        <path
          d="M5 13l4 4L19 7"
          stroke="currentColor"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          style={{
            strokeDasharray: 1,
            strokeDashoffset: checked ? 0 : 1,
            transition: "stroke-dashoffset 300ms ease",
          }}
        />
      </svg>
    </span>
  );
}
