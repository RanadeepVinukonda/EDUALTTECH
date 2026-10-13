"use client";

import { useRef } from "react";
import { cn } from "@/lib/cn";

/**
 * Numeric one-time-code input. Auto-advances, supports backspace and paste.
 * ponytail: value is a plain digit string; interior edits collapse trailing
 * gaps. Forward typing + paste + backspace (the real flows) are exact.
 */
export default function PinInput({
  length = 6,
  value,
  onChange,
  disabled,
  autoFocus,
  ariaLabel = "Verification code",
  className,
}: {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const chars = Array.from({ length }, (_, i) => value[i] ?? "");

  function fillFrom(start: number, digits: string) {
    const next = chars.slice();
    for (let k = 0; k < digits.length && start + k < length; k++) next[start + k] = digits[k];
    onChange(next.join(""));
    refs.current[Math.min(start + digits.length, length - 1)]?.focus();
  }

  function setAt(index: number, digit: string) {
    const next = chars.slice();
    next[index] = digit;
    onChange(next.join(""));
  }

  return (
    <div className={cn("flex gap-2", className)} role="group" aria-label={ariaLabel}>
      {chars.map((c, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={c}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          aria-label={`${ariaLabel} digit ${i + 1}`}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (digits.length > 1) {
              fillFrom(i, digits);
              return;
            }
            setAt(i, digits);
            if (digits && i < length - 1) refs.current[i + 1]?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !c && i > 0) {
              e.preventDefault();
              refs.current[i - 1]?.focus();
            } else if (e.key === "ArrowLeft" && i > 0) {
              refs.current[i - 1]?.focus();
            } else if (e.key === "ArrowRight" && i < length - 1) {
              refs.current[i + 1]?.focus();
            }
          }}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text").replace(/\D/g, "");
            if (text) {
              e.preventDefault();
              fillFrom(i, text);
            }
          }}
          className="pin-input"
        />
      ))}
    </div>
  );
}
