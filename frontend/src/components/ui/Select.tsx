import { cn } from "@/lib/cn";

export default function Select({
  className,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { error?: boolean }) {
  return (
    <select
      className={cn(
        "w-full rounded-xl border bg-white px-4 py-3 text-[15px] text-ink-900 outline-none transition",
        "appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%2216%22%20height=%2216%22%20fill=%22%2364748b%22%20viewBox=%220%200%2020%2020%22%3E%3Cpath%20d=%22M5.5%207.5%2010%2012l4.5-4.5%22%20stroke=%22%2364748b%22%20stroke-width=%221.5%22%20fill=%22none%22%20stroke-linecap=%22round%22%20stroke-linejoin=%22round%22/%3E%3C/svg%3E')] bg-[right_1rem_center] bg-no-repeat pr-10",
        "focus:ring-2",
        error
          ? "border-danger focus:border-danger focus:ring-danger/20"
          : "border-slate-300 focus:border-brand-600 focus:ring-brand-600/20",
        className,
      )}
      aria-invalid={error || undefined}
      {...props}
    >
      {children}
    </select>
  );
}