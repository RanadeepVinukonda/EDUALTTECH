"use client";

import { useState } from "react";
import CoverImage from "@/components/ui/CoverImage";

/**
 * Program card image: shows the organization logo and reveals the program
 * photo. Pointer devices reveal on hover; touch devices reveal on tap and
 * while pressed. The hover variant is gated behind @media (hover:hover) in
 * Tailwind v4, and group-active works even before hydration, so touch always
 * has a working path to the photo.
 */
export default function ProgramReveal({
  logo,
  photo,
  name,
  className,
}: {
  logo: string;
  photo: string;
  name: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setOpen((v) => !v)}
      aria-pressed={open}
      aria-label={open ? `Hide photos from our ${name} program` : `Show photos from our ${name} program`}
      className={`group relative flex h-60 w-full cursor-pointer touch-manipulation items-center justify-center overflow-hidden border-b border-rule bg-[#ffffff] p-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 ${
        className ?? ""
      }`}
    >
      <CoverImage
        src={logo}
        alt={name}
        fallback={name}
        className={`h-full max-h-36 w-full object-contain transition-all duration-300 group-hover:scale-95 group-hover:opacity-0 group-active:opacity-0 ${
          open ? "scale-95 opacity-0" : ""
        }`}
      />
      <CoverImage
        src={photo}
        alt={`${name} program`}
        fallback={name}
        className={`absolute inset-0 h-full w-full object-cover transition-all duration-300 group-hover:scale-[1.03] group-hover:opacity-100 group-active:opacity-100 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute bottom-3 right-3 rounded-full border border-rule/80 bg-paper/95 px-2.5 py-1 text-[11px] font-medium text-ink-2 shadow-elev1 backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-0 ${
          open ? "opacity-0" : "opacity-100"
        }`}
      >
        Hover or tap for classroom photo
      </span>
    </button>
  );
}
