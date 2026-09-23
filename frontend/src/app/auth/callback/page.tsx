"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { persistSessionTokens } from "@/lib/api";

function decodeJwtPayload(token: string): { email?: string } | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as { email?: string };
  } catch {
    return null;
  }
}

export default function AuthCallbackPage() {
  const [state, setState] = useState<"working" | "done" | "error">("working");

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setState("error");
      return;
    }

    persistSessionTokens(accessToken, refreshToken);

    // Signal the signup tab (verify-email page) that the link was opened.
    const email = decodeJwtPayload(accessToken)?.email;
    if (email) {
      localStorage.setItem(`eat:email-verified:${email}`, String(Date.now()));
    }

    setState("done");
    window.history.replaceState(null, "", "/auth/callback");
  }, []);

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {state === "working" ? (
          <p className="text-sm text-slate-600">Confirming your email…</p>
        ) : state === "done" ? (
          <>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand-700" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">Email verified</h1>
            <p className="mt-2 text-sm text-slate-600">
              Your account is unlocked. Sign in to continue to your dashboard.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700"
            >
              Go to login
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-display text-2xl font-bold text-slate-900">Link invalid</h1>
            <p className="mt-2 text-sm text-slate-600">
              This link is missing its tokens. Request a fresh one from the sign-in page.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700"
            >
              Go to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}