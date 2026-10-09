import { cn } from "@/lib/cn";

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}) {
  const variants = {
    primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-elev1",
    secondary: "bg-white text-ink-700 border border-slate-300 hover:bg-slate-50",
    ghost: "bg-transparent text-ink-700 hover:bg-slate-100",
    danger: "bg-danger text-white hover:brightness-95 shadow-elev1",
  } as const;
  const sizes = { sm: "px-3 py-2 text-sm", md: "px-5 py-3 text-[15px]", lg: "px-6 py-3.5 text-base" } as const;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40",
        "disabled:opacity-50 disabled:pointer-events-none",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
