import { cn } from "@/lib/cn";

export default function Select({
  className,
  error,
  icon,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean; icon?: React.ReactNode }) {
  const field = (
    <select
      className={cn(
        "w-full h-10.5 rounded-lg border bg-white px-3.5 pr-10 text-sm text-slate-900 outline-none transition-colors duration-150 shadow-2xs focus:ring-3",
        Boolean(icon) && "pl-10",
        error
          ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15 text-rose-900"
          : "border-slate-300 focus:border-brand-600 focus:ring-brand-600/15",
        className,
      )}
      aria-invalid={error || undefined}
      {...props}
    >
      {children}
    </select>
  );

  if (!icon) return field;

  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-0 flex w-11 items-center justify-center text-slate-400">
        {icon}
      </span>
      {field}
    </div>
  );
}
