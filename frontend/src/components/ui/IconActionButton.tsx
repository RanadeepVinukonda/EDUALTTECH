"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const ICONS = {
  delete: {
    viewBox: "0 0 448 512",
    d: "M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z",
  },
  view: {
    viewBox: "0 0 24 24",
    d: "M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7C21.27 8.11 17 5 12 5zm0 12a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  },
} as const;

type Icon = keyof typeof ICONS;

interface IconActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: Icon;
  label: string;
}

export default function IconActionButton({ icon, label, className, ...props }: IconActionButtonProps) {
  return (
    <button
      type="button"
      className={cn("hv-btn", `hv-btn--${icon}`, className)}
      aria-label={label}
      data-label={label}
      {...props}
    >
      <svg viewBox={ICONS[icon].viewBox} className="hv-btn__icon" aria-hidden>
        <path d={ICONS[icon].d} />
      </svg>
    </button>
  );
}

export function DeleteButton(props: Omit<IconActionButtonProps, "icon" | "label">) {
  return <IconActionButton icon="delete" label="Delete" {...props} />;
}

export function ViewButton(props: Omit<IconActionButtonProps, "icon" | "label">) {
  return <IconActionButton icon="view" label="View" {...props} />;
}