import { cn } from "@/lib/cn";

export default function SectionHeading({
  title,
  lead,
  as: As = "h2",
  className,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", className)}>
      <As className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-ink-900 leading-tight">
        {title}
      </As>
      {lead && <p className="mt-3 text-base sm:text-lg leading-relaxed text-slate-600">{lead}</p>}
    </div>
  );
}
