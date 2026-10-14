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
      className={`group relative flex h-56 w-full touch-manipulation items-center justify-center overflow-hidden border-b border-slate-100 bg-slate-50 p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 ${
        className ?? ""
      }`}
    >
      <CoverImage
        src={logo}
        alt={name}
        fallback={name}
        className={`h-full w-full object-contain transition-opacity duration-300 group-hover:opacity-0 group-active:opacity-0 ${
          open ? "opacity-0" : ""
        }`}
      />
      <CoverImage
        src={photo}
        alt={`${name} program`}
        fallback={name}
        className={`absolute inset-0 transition-opacity duration-300 group-hover:opacity-100 group-active:opacity-100 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
    </button>
  );
}
