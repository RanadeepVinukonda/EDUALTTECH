"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import Button from "@/components/ui/Button";

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
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-[15px] text-slate-500">{description}</p>}
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
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-2xl font-bold",
          tone === "warn" ? "text-amber-700" : tone === "danger" ? "text-red-700" : "text-ink-900",
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </>
  );
  const cls = "rounded-[20px] border border-slate-200 bg-white p-5 shadow-elev1";
  return href ? (
    <Link href={href} className={cn(cls, "transition hover:border-brand-300")}>
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
    <section className="rounded-[20px] border border-slate-200 bg-white shadow-elev1">
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            {title && <h2 className="font-display text-lg font-bold text-ink-900">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

const TONE: Record<string, string> = {
  success: "bg-emerald-50 text-emerald-800",
  warn: "bg-amber-50 text-amber-800",
  danger: "bg-red-50 text-red-700",
  info: "bg-brand-50 text-brand-800",
  neutral: "bg-slate-100 text-ink-700",
};

export function StatusPill({ tone = "neutral", children }: { tone?: keyof typeof TONE; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", TONE[tone] ?? TONE.neutral)}>
      {children}
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
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-500">
        Page {page} of {pages} · {total} result{total === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" disabled={busy || page <= 1} onClick={() => onChange(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={busy || !hasMore} onClick={() => onChange(page + 1)}>
          Next
        </Button>
      </div>
    </div>
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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4" role="presentation" onClick={() => !busy && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev3"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="confirm-title" className="font-display text-lg font-bold text-ink-900">
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

/** Small labelled select for filters. */
export function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
