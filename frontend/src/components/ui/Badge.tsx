import { cn } from "@/lib/cn";

export type BadgeTone = "success" | "danger" | "warning" | "neutral" | "brand";

const tones: Record<BadgeTone, string> = {
  success: "bg-brand-100 text-brand-800",
  brand: "bg-brand-100 text-brand-800",
  danger: "bg-red-100 text-red-700",
  warning: "bg-amber-100 text-amber-800",
  neutral: "bg-slate-100 text-slate-600",
};

export default function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", tones[tone], className)}>
      {children}
    </span>
  );
}
