import { cn } from "@/lib/cn";

export default function Input({
  className,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border px-4 py-3 text-[15px] bg-white placeholder:text-slate-400 outline-none transition",
        "focus:ring-2",
        error
          ? "border-danger focus:border-danger focus:ring-danger/20"
          : "border-slate-300 focus:border-brand-600 focus:ring-brand-600/20",
        className,
      )}
      aria-invalid={error || undefined}
      {...props}
    />
  );
}
