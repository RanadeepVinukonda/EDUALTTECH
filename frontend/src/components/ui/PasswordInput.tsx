"use client";

import { useState, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { id?: string };

const LEVELS = [
  { label: "Weak", bar: "bg-red-500", text: "text-red-600" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-600" },
  { label: "Good", bar: "bg-lime-500", text: "text-lime-600" },
  { label: "Strong", bar: "bg-brand-600", text: "text-brand-700" },
];

/** Backend requires 8+ characters with at least one letter and one number. */
function score(value: string): number {
  if (!value) return -1;
  let s = 0;
  if (value.length >= 8) s++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) s++;
  if (/\d/.test(value)) s++;
  if (/[^\w\s]/.test(value)) s++;
  if (value.length >= 12) s++;
  return Math.min(Math.round((s / 5) * 4), 3);
}

const CHECKS = [
  { test: (v: string) => v.length >= 8, hint: "8+ characters" },
  { test: (v: string) => /[a-zA-Z]/.test(v), hint: "a letter" },
  { test: (v: string) => /\d/.test(v), hint: "a number" },
];

export default function PasswordInput({ className = "", onChange, ...rest }: Props) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState(String(rest.value ?? rest.defaultValue ?? ""));

  const level = score(value);
  const showMeter = level >= 0;
  const bars = level + 1;

  return (
    <div className={className}>
      <div className="flex h-[50px] items-center rounded-[10px] border-[1.5px] border-slate-200 bg-white px-3 transition focus-within:border-brand-500">
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
        </svg>
        <input
          type={visible ? "text" : "password"}
          value={rest.value ?? value}
          {...rest}
          onChange={(e) => {
            setValue(e.target.value);
            onChange?.(e);
          }}
          aria-describedby={showMeter ? `${rest.id ?? "pw"}-strength` : undefined}
          className="ml-2 h-full w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setVisible((v) => !v)}
          className="shrink-0 pl-2 text-slate-400 hover:text-slate-600"
        >
          {visible ? (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
              <line x1="3" y1="3" x2="21" y2="21" />
            </svg>
          )}
        </button>
      </div>

      {showMeter && (
        <div id={`${rest.id ?? "pw"}-strength`} className="mt-2" aria-live="polite">
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1" role="progressbar" aria-valuenow={bars} aria-valuemin={0} aria-valuemax={4} aria-label="Password strength">
              {LEVELS.map((l, i) => (
                <span key={l.label} className={`h-1.5 flex-1 rounded-full ${i < bars ? l.bar : "bg-slate-200"}`} />
              ))}
            </div>
            <span className={`text-xs font-semibold ${LEVELS[level].text}`}>{LEVELS[level].label}</span>
          </div>
          <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
            {CHECKS.map((c) => (
              <span key={c.hint} className={c.test(value) ? "text-brand-700" : undefined}>
                {c.test(value) ? "✓" : "○"} {c.hint}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
}