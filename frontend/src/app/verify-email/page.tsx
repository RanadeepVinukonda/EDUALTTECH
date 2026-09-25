"use client";

import { FormEvent, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

const RESEND_COOLDOWN_MS = 60_000;

function VerifyEmailInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState(useMemo(() => params.get("email") ?? "", [params]));
  const [verified, setVerified] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sentAt, setSentAt] = useState<number>(() => Date.now()); // the signup email was just sent

  // Cross-tab sync: the confirmation link opens in a new tab; the callback
  // page there writes eat:email-verified:<email>, and this tab flips to the
  // "verified, go sign in" panel when it sees that key.
  useEffect(() => {
    if (!email) return;
    const key = `eat:email-verified:${email}`;
    if (localStorage.getItem(key)) {
      setVerified(true);
      return;
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) setVerified(true);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [email]);

  // Resend cooldown countdown.
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [remaining]);
  useEffect(() => {
    setRemaining(Math.max(0, Math.ceil((sentAt + RESEND_COOLDOWN_MS - Date.now()) / 1000)));
  }, [sentAt]);

  const resend = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!email || remaining > 0) return;
      setBusy(true);
      setMessage(null);
      try {
        const data = await api<{ message: string }>("/auth/resend-verification", {
          method: "POST",
          body: JSON.stringify({ email }),
        });
        setSentAt(Date.now());
        setMessage(data.message);
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Could not send the link");
      } finally {
        setBusy(false);
      }
    },
    [email, remaining],
  );

  if (verified) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
            <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand-700" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-slate-900">Email verified</h1>
          <p className="mt-2 text-sm text-slate-600">{email} is confirmed. Sign in to continue to your dashboard.</p>
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="mt-6 w-full rounded-lg brand-grad py-2.5 font-semibold text-white hover:bg-brand-700"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-slate-900">Check your inbox</h1>
        <p className="mt-2 text-sm text-slate-600">
          We sent a confirmation link to <span className="font-semibold text-slate-800">{email || "your address"}</span>.
          Open it to unlock your account. Once verified, come back here and sign in.
        </p>

        <form onSubmit={resend} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              placeholder="you@school.in"
            />
          </div>
          <button
            type="submit"
            disabled={busy || remaining > 0}
            className="w-full rounded-lg brand-grad py-2.5 font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {busy ? "Sending…" : remaining > 0 ? `Resend in ${remaining}s` : "Send another link"}
          </button>
        </form>

        {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
        {sentAt > 0 && (
          <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">
            Missing it? Check spam, then wait for the timer and try again.
          </p>
        )}

        <p className="mt-6 text-sm text-slate-500">
          Didn&apos;t sign up?{" "}
          <Link href="/register" className="font-semibold text-brand-700 hover:text-brand-800">
            Create a new account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-slate-500">Loading…</p>}>
      <VerifyEmailInner />
    </Suspense>
  );
}