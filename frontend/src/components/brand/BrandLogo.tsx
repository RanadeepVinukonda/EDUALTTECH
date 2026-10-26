import { cn } from "@/lib/cn";

export default function BrandLogo({
  onDark = false,
  withWordmark = false,
  wordmarkClassName,
  className,
}: {
  onDark?: boolean;
  withWordmark?: boolean;
  wordmarkClassName?: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/media/brand/logo.png"
        alt="EduAltTech"
        width={432}
        height={436}
        className={cn("h-8 w-auto", onDark && "brightness-0 invert")}
      />
      {withWordmark && (
        <span
          className={cn(
            "font-display font-extrabold tracking-tight",
            wordmarkClassName ?? "text-lg",
            onDark ? "text-white" : "text-ink-900",
          )}
        >
          EduAltTech
        </span>
      )}
    </span>
  );
}