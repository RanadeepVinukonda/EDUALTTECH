"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export default function SubmitApplicationButton({
  children = "Continue Application",
  loading,
  disabled,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type="submit"
      className={cn("appl-btn", className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      <span aria-hidden>
        <span className="appl-pencil" />
        <span className="appl-folder">
          <span className="appl-top">
            <svg viewBox="0 0 24 27">
              <path d="M1,0 L23,0 C23.5522847,-1.01453063e-16 24,0.44771525 24,1 L24,8.17157288 C24,8.70200585 23.7892863,9.21071368 23.4142136,9.58578644 L20.5857864,12.4142136 C20.2107137,12.7892863 20,13.2979941 20,13.8284271 L20,26 C20,26.5522847 19.5522847,27 19,27 L1,27 C0.44771525,27 6.76353751e-17,26.5522847 0,26 L0,1 C-6.76353751e-17,0.44771525 0.44771525,1.01453063e-16 1,0 Z" />
            </svg>
          </span>
          <span className="appl-paper" />
        </span>
      </span>
      {loading ? "Submitting…" : children}
    </button>
  );
}