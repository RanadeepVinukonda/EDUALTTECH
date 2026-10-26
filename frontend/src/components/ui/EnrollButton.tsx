"use client";

import { useEffect, useRef, useState } from "react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Duration (ms) of the tx-card animation before the click callback fires. */
const ANIM_MS = 1300;

export default function EnrollButton({
  children,
  loading,
  disabled,
  className,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  const [paying, setPaying] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    if (paying || loading || disabled) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      onClick?.(e);
      return;
    }
    setPaying(true);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      setPaying(false);
      onClick?.(e);
    }, ANIM_MS);
  }

  return (
    <button
      className={cn("tx-card", paying && "is-paying", className)}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-busy={paying}
      {...props}
    >
      <span className="tx-left" aria-hidden>
        <span className="tx-card-inner">
          <span className="tx-line" />
          <span className="tx-buttons" />
        </span>
        <span className="tx-post">
          <span className="tx-post-line" />
          <span className="tx-screen">
            <span className="tx-dollar">$</span>
          </span>
          <span className="tx-numbers" />
          <span className="tx-numbers-line2" />
        </span>
      </span>
      <span className="tx-right">
        <span className="tx-new">{children}</span>
        {loading ? (
          <span
            aria-hidden
            className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        ) : (
          <svg viewBox="0 0 451.846 451.847" className="tx-arrow" aria-hidden>
            <path
              fill="#cfcfcf"
              d="M345.441 248.292L151.154 442.573c-12.359 12.365-32.397 12.365-44.75 0-12.354-12.354-12.354-32.391 0-44.744L278.318 225.92 106.409 54.017c-12.354-12.359-12.354-32.394 0-44.748 12.354-12.359 32.391-12.359 44.75 0l194.287 194.284c6.177 6.18 9.262 14.271 9.262 22.366 0 8.099-3.091 16.196-9.267 22.373z"
            />
          </svg>
        )}
      </span>
    </button>
  );
}