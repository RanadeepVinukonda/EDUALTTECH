"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import Button, { buttonClass } from "@/components/ui/Button";
import { useFocusTrap } from "@/components/ui/useFocusTrap";

export { default as Skeleton } from "@/components/ui/Skeleton";

/** Debounces a value (search inputs). Returns the last value after `delay` ms of quiet. */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/**
 * Minimal async loader: runs `fn` on mount + whenever `deps` or a manual reload
 * change. Ignores stale responses (unmount / superseded request).
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const seq = useRef(0);

  useEffect(() => {
    const id = ++seq.current;
    setLoading(true);
    setError(null);
    fn()
      .then((d) => {
        if (id === seq.current) setData(d);
      })
      .catch((e: unknown) => {
        if (id === seq.current) setError(e instanceof Error ? e.message : "Something went wrong");
      })
      .finally(() => {
        if (id === seq.current) setLoading(false);
      });
    // deps intentionally spread — callers pass a memoized fetcher plus keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, error, loading, reload: () => setTick((t) => t + 1) };
}

export function AdminHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
      <div className="min-w-0">
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-[28px]">
          {title}
        </h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function MetricCard({
  label,
  value,
  hint,
  href,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  href?: string;
  tone?: "default" | "warn" | "danger";
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold text-slate-600">{label}</p>
        {href && (
          <svg aria-hidden viewBox="0 0 16 16" className="h-3.5 w-3.5 text-slate-400 transition group-hover:text-brand-600">
            <path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <p
        className={cn(
          "mt-3 font-display text-[28px] font-semibold leading-none tracking-tight tabular-nums",
          tone === "warn" ? "text-amber-700" : tone === "danger" ? "text-red-700" : "text-ink-900",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-2.5 text-xs leading-snug text-slate-500">{hint}</p>}
    </>
  );
  const cls = cn(
    "group border-t-2 bg-paper-2/70 px-4 py-3.5",
    tone === "warn"
      ? "border-amber-400"
      : tone === "danger"
        ? "border-red-400"
        : "border-slate-300",
  );
  return href ? (
    <Link href={href} className={cn(cls, "transition hover:border-brand-500")}>
      {inner}
    </Link>
  ) : (
    <div className={cls}>{inner}</div>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
}: {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-slate-200 bg-paper shadow-elev1">
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-paper-2/60 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="font-display text-[15px] font-semibold tracking-tight text-ink-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className="min-w-0 p-4 sm:p-5">{children}</div>
    </section>
  );
}

const TONE: Record<string, string> = {
  success: "bg-brand-50 text-brand-800",
  warn: "bg-amber-50 text-amber-900",
  danger: "bg-red-50 text-red-800",
  info: "bg-brand-50 text-brand-800",
  neutral: "bg-slate-100 text-ink-700",
};

export function StatusPill({ tone = "neutral", children }: { tone?: keyof typeof TONE; children: React.ReactNode }) {
  const text = typeof children === "string" ? children.replace(/_/g, " ").toLowerCase() : null;
  const label = text ? `${text.charAt(0).toUpperCase()}${text.slice(1)}` : children;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-1 text-[11px] font-semibold leading-none",
        TONE[tone] ?? TONE.neutral,
      )}
    >
      {label}
    </span>
  );
}

export function statusTone(status: string): keyof typeof TONE {
  switch (status) {
    case "PUBLISHED":
    case "PAID":
    case "ACCEPTED":
    case "ACTIVE":
      return "success";
    case "DRAFT":
    case "CREATED":
    case "SUBMITTED":
    case "UNDER_REVIEW":
    case "INTERVIEW_SCHEDULED":
      return "warn";
    case "ARCHIVED":
    case "FAILED":
    case "REJECTED":
      return "danger";
    default:
      return "neutral";
  }
}

export function humanizeStatus(status: string) {
  return status.replace(/_/g, " ").toLowerCase();
}

export function userName(u: { firstName: string; lastName: string; email?: string } | null | undefined) {
  if (!u) return "Unknown user";
  const name = `${u.firstName} ${u.lastName}`.trim();
  return name || u.email || "Unknown user";
}

/** Accessible pager for server-side lists. */
export function Pagination({
  page,
  total,
  limit,
  hasMore,
  onChange,
  busy,
}: {
  page: number;
  total: number;
  limit: number;
  hasMore: boolean;
  onChange: (page: number) => void;
  busy?: boolean;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) {
    return total > 0 ? <p className="text-sm text-slate-500">{total} result{total === 1 ? "" : "s"}</p> : null;
  }
  const items: (number | "gap")[] = [];
  for (let p = 1; p <= pages; p++) {
    if (p === 1 || p === pages || Math.abs(p - page) <= 1) items.push(p);
    else if (items[items.length - 1] !== "gap") items.push("gap");
  }
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
      <p className="text-sm text-slate-500">
        Page {page} of {pages} · {total} result{total === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-1.5">
        <Button variant="secondary" size="sm" disabled={busy || page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </Button>
        {items.map((item, i) =>
          item === "gap" ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-slate-400" aria-hidden>
              …
            </span>
          ) : item === page ? (
            <span key={item} aria-current="page" className={buttonClass("primary", "sm", "min-w-9 pointer-events-none text-center tabular-nums")}>
              {item}
            </span>
          ) : (
            <Button
              key={item}
              variant="ghost"
              size="sm"
              className="min-w-9 tabular-nums"
              disabled={busy}
              onClick={() => onChange(item)}
            >
              {item}
            </Button>
          ),
        )}
        <Button variant="secondary" size="sm" disabled={busy || !hasMore} onClick={() => onChange(page + 1)}>
          Next
        </Button>
      </div>
    </nav>
  );
}

/** Focus-trapped confirm dialog. Effect is explained by the caller via `children`. */
export function ConfirmDialog({
  open,
  title,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  busy = false,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef, open, busy ? undefined : onClose);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4" role="presentation" onClick={() => !busy && onClose()}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto overscroll-contain rounded-lg border border-slate-200 bg-paper p-6 shadow-elev3"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-display text-lg font-semibold text-ink-900">
          {title}
        </h2>
        <div className="mt-2 text-sm text-slate-600">{children}</div>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button variant="secondary" size="sm" disabled={busy} onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button autoFocus variant={tone === "danger" ? "danger" : "primary"} size="sm" loading={busy} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Small labelled select for filters (compact chip style). */
export function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  icon,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <label htmlFor={id} className="text-xs font-semibold text-slate-600">
        {label}
      </label>
      <div className="relative inline-flex items-center">
        {icon && <span className="pointer-events-none absolute left-2.5 text-slate-500 [&>svg]:text-base">{icon}</span>}
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`h-9 cursor-pointer appearance-none rounded-lg border border-slate-300 bg-white pr-8 text-xs font-semibold text-ink-900 transition hover:border-brand-400 focus-visible:border-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/30 ${
            icon ? "pl-8" : "pl-3"
          }`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-2 h-3.5 w-3.5 fill-slate-500"
        >
          <path d="M5.5 7.5 10 12l4.5-4.5" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}
