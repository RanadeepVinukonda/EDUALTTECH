import { cn } from "@/lib/cn";

export type BadgeTone = "success" | "danger" | "warning" | "neutral" | "brand" | "info";

const tones: Record<BadgeTone, string> = {
  success: "bg-emerald-50 text-emerald-700 border border-emerald-200/80",
  brand: "bg-brand-50 text-brand-800 border border-brand-200/80",
  danger: "bg-rose-50 text-rose-700 border border-rose-200/80",
  warning: "bg-amber-50 text-amber-800 border border-amber-200/80",
  neutral: "bg-slate-100 text-slate-700 border border-slate-200",
  info: "bg-sky-50 text-sky-700 border border-sky-200/80",
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
    <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold tracking-wide", tones[tone], className)}>
      {children}
    </span>
  );
}
