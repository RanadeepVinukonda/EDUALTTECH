"use client";

import Link from "next/link";
import ErrorOutlined from "@mui/icons-material/ErrorOutlined";
import Button, { buttonClass } from "@/components/ui/Button";

/** Shared route-level error UI. Framework `reset` retries the segment render. */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center sm:px-6">
      <span aria-hidden className="grid h-12 w-12 place-items-center rounded-full bg-red-50 text-red-600">
        <ErrorOutlined />
      </span>
      <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">Something went wrong</h1>
      <p className="mt-2 text-[15px] text-ink-600">
        This section ran into an unexpected problem. Try again, or continue elsewhere — the rest of your workspace is unaffected.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button size="sm" onClick={reset}>
          Try again
        </Button>
        <Link href="/dashboard" className={buttonClass("secondary", "sm")}>
          Back to dashboard
        </Link>
      </div>
      {error.digest && <p className="mt-6 font-mono text-xs text-slate-400">Reference: {error.digest}</p>}
    </div>
  );
}
