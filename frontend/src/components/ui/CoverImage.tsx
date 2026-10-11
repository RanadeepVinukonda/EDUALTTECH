"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

function hasPrefix(className: string | undefined, prefix: string): boolean {
  if (!className) return false;
  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\s)${escaped}`).test(className);
}

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

  const fill = hasPrefix(className, "h-") || hasPrefix(className, "w-") || hasPrefix(className, "aspect-") ? "" : "h-full w-full";
  const objectFit = hasPrefix(className, "object-") ? "" : "object-cover";

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center overflow-hidden bg-brand-50 p-4 text-center text-sm font-semibold text-brand-700",
          fill,
          className,
        )}
      >
        {fallback}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={() => setFailed(true)} className={cn(fill, objectFit, className)} />
  );
}
