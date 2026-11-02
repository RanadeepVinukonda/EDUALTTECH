import { cn } from "@/lib/cn";

const chevron =
  "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2216%22%20height=%2216%22%20fill=%22%2364748b%22%20viewBox=%220%200%2020%2020%22%3E%3Cpath%20d=%22M5.5%207.5%2010%2012l4.5-4.5%22%20stroke=%22%2364748b%22%20stroke-width=%221.5%22%20fill=%22none%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/%3E%3C/svg%3E')] bg-[right_1rem_center] bg-no-repeat";

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
        "w-full h-10.5 appearance-none rounded-lg border bg-white px-3.5 pr-10 text-sm text-slate-900 outline-none transition-all duration-150 shadow-2xs focus:ring-3",
        chevron,
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
