import { cn } from "@/lib/cn";

/** Shape-matched placeholder. Respects reduced-motion (no shimmer for those users). */
export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-lg bg-slate-100 motion-reduce:animate-none", className)}
    />
  );
}
