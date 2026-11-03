"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-dvh bg-paper text-ink">
        <main className="container flex min-h-dvh flex-col items-center justify-center py-12 text-center">
          <h1 className="font-display text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 max-w-[48ch] text-ink-2">
            The application hit an unexpected error. Reloading usually fixes it.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-lg bg-accent px-6 py-3 font-semibold text-accent-ink transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Try again
            </button>
            <a
              href="/"
              className="rounded-lg border border-rule px-6 py-3 font-semibold text-ink-2 transition-colors hover:bg-paper-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Go home
            </a>
          </div>
          {error.digest && (
            <p className="mt-6 text-sm text-muted">Reference: {error.digest}</p>
          )}
        </main>
      </body>
    </html>
  );
}
