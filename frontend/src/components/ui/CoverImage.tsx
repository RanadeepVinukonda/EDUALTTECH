"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

export default function CoverImage({
  src,
  alt = "",
  fallback,
  className,
}: {
  src: string | null;
  alt?: string;
  fallback: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-brand-50 p-4 text-center text-sm font-semibold text-brand-700",
          className,
        )}
      >
        {fallback}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={() => setFailed(true)} className={cn("h-full w-full object-cover", className)} />
  );
}
