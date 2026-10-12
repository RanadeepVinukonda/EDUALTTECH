import { cn } from "@/lib/cn";

export default function Input({
  className,
  error,
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean; icon?: React.ReactNode }) {
  const field = (
    <input
      className={cn(
        "w-full rounded-xl border px-4 py-3 text-[15px] bg-white placeholder:text-slate-400 outline-none transition",
        "focus:ring-2",
        Boolean(icon) && "pl-11",
        error
          ? "border-danger focus:border-danger focus:ring-danger/20"
          : "border-slate-300 focus:border-brand-600 focus:ring-brand-600/20",
        className,
      )}
      aria-invalid={error || undefined}
      {...props}
    />
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
