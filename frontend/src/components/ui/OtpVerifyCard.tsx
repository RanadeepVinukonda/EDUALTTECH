"use client";

import { FormEvent, useRef } from "react";

export default function OtpVerifyCard({
  title,
  subtitle,
  length = 6,
  value,
  onChange,
  onSubmit,
  onBack,
  submitLabel = "Submit",
  busy = false,
}: {
  title: string;
  subtitle?: string;
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onBack?: () => void;
  submitLabel?: string;
  busy?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, " ").split("").slice(0, length);

  function handleDigitChange(i: number, raw: string) {
    const clean = raw.replace(/\D/g, "");
    if (!clean) {
      onChange(value.slice(0, i) + value.slice(i + 1));
      return;
    }
    const next = value.slice(0, i) + clean.slice(-1) + value.slice(i + 1);
    onChange(next.slice(0, length));
    if (i < length - 1) refs.current[i + 1]?.focus();
  }

  function handleKey(i: number, key: string) {
    if (key === "Backspace" && !value[i] && i > 0) refs.current[i - 1]?.focus();
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="font-display text-lg font-bold text-slate-900">{title}</p>

      <svg viewBox="0 0 60 60" className="mx-auto mt-4 h-14 w-14" aria-hidden="true">
        <circle cx="30" cy="30" r="28" className="fill-brand-50" />
        <path
          d="M18 31l8 8 16-18"
          fill="none"
          stroke="#038c3e"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {subtitle && <p className="mt-4 text-center text-sm text-slate-600">{subtitle}</p>}

      <div className="mt-6 flex justify-center gap-3">
        {Array.from({ length }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { refs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={2}
            value={digits[i] === " " ? "" : digits[i]}
            onChange={(e) => handleDigitChange(i, e.target.value)}
            onKeyDown={(e) => handleKey(i, e.key)}
            aria-label={`Digit ${i + 1}`}
            className="h-11 w-11 rounded-lg border border-slate-200 bg-slate-100 text-center text-lg font-semibold text-slate-900 shadow-[inset_2px_2px_4px_#d1d1d1,inset_-2px_-2px_4px_#ffffff] outline-none transition hover:border-slate-300 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-200"
          />
        ))}
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-2">
        <button
          type="submit"
          disabled={busy || value.length !== length}
          className="w-full rounded-lg bg-slate-800 py-3 font-semibold text-white shadow-[1px_1px_3px_#b5b5b5,-1px_-1px_3px_#ffffff] transition hover:bg-slate-900 disabled:opacity-50 active:shadow-[inset_2px_2px_4px_#b5b5b5,inset_-2px_-2px_4px_#ffffff]"
        >
          {busy ? "Working…" : submitLabel}
        </button>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            disabled={busy}
            className="w-full rounded-lg bg-white py-3 font-medium text-slate-600 shadow-[1px_1px_3px_#b5b5b5,-1px_-1px_3px_#ffffff] transition hover:text-slate-900 active:shadow-[inset_2px_2px_4px_#b5b5b5,inset_-2px_-2px_4px_#ffffff]"
          >
            Back
          </button>
        )}
      </form>
    </div>
  );
}