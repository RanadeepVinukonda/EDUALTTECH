import { cn } from "@/lib/cn";

export default function SectionHeading({
  eyebrow,
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
      {eyebrow && (
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">{eyebrow}</p>
      )}
      <As className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
        {title}
      </As>
      {lead && <p className="mt-4 text-lg leading-relaxed text-ink-600">{lead}</p>}
    </div>
  );
}
