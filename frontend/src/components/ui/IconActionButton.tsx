"use client";

import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const SVG_PATH = {
  delete:
    "M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z",
  view: "M288 32c-80.8 0-145.5 36.8-191.6 94.3C50.5 132 24.8 169.7 13 200c-11.8 30.3-11.8 62.6 0 93 11.8 30.3 38.2 68 83.4 106.3C122.6 443.2 178.1 480 288 480s165.4-36.8 215.6-80.7C548.9 361 575.3 323.3 587 293c11.8-30.3 11.8-62.6 0-93-11.8-30.3-38.2-68-83.4-106.3C498.4 68.8 442.9 32 288 32zm0 352c-88.4 0-160-71.6-160-160s71.6-160 160-160 160 71.6 160 160-71.6 160-160 160zm0-256c-53 0-96 43-96 96s43 96 96 96 96-43 96-96-43-96-96-96z",
} as const;

type Icon = keyof typeof SVG_PATH;

interface IconActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: Icon;
  label: string;
}

export default function IconActionButton({ icon, label, className, ...props }: IconActionButtonProps) {
  return (
    <button
      type="button"
      className={cn("hv-btn", className)}
      aria-label={label}
      data-label={label}
      {...props}
    >
      <svg viewBox={icon === "delete" ? "0 0 448 512" : "0 0 576 512"} className="hv-btn__icon" aria-hidden>
        <path d={SVG_PATH[icon]} />
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