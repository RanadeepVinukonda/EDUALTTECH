"use client";

import { useState, type InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & { id?: string };

const LEVELS = ["Weak", "Fair", "Good", "Strong"];

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
        <div id={`${rest.id ?? "pw"}-strength`} className="mt-2.5 flex items-center gap-3" aria-live="polite">
          <div
            className="flex flex-1 gap-1"
            role="progressbar"
            aria-valuenow={bars}
            aria-valuemin={0}
            aria-valuemax={4}
            aria-label="Password strength"
          >
            {LEVELS.map((label, i) => (
              <span
                key={label}
                className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
                  i < bars ? "bg-slate-900" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <span className="shrink-0 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">
            {LEVELS[level]}
          </span>
        </div>
      )}
    </div>
  );
}