"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

export default function EmailVerifyModal({
  email,
  onVerified,
  onClose,
}: {
  email: string;
  onVerified: () => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function sendCode(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    try {
      const data = await api<{ message: string; devOtp?: string }>("/auth/send-email-code", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
      setCountdown(60);
      if (data.devOtp) setCode(data.devOtp); // dev: pre-fill so the flow is testable headless
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send the code");
    } finally {
      setSending(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setVerifying(true);
    setError(null);
    try {
      await api<{ verified: true }>("/auth/verify-email-code", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      onVerified();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "That code did not verify");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-label="Verify email">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-elev3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">Verify your email</h2>
            <p className="mt-1 text-sm text-slate-600">
              We&apos;ll email a 6-digit code to <span className="font-medium text-slate-900">{email}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        {!sent ? (
          <form onSubmit={sendCode} className="mt-4">
            <button
              type="submit"
              disabled={sending}
              className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send the code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verify} className="mt-4 space-y-3">
            <div>
              <label htmlFor="verify-code" className="mb-1 block text-sm font-medium text-slate-700">
                Enter the 6-digit code
              </label>
              <input
                id="verify-code"
                inputMode="numeric"
                pattern="[0-9]{6}"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-[0.4em] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="000000"
              />
            </div>
            <button
              type="submit"
              disabled={verifying || code.length !== 6}
              className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {verifying ? "Checking…" : "Verify"}
            </button>
            <button
              type="button"
              onClick={sendCode}
              disabled={sending || countdown > 0}
              className="w-full text-center text-sm font-medium text-slate-500 hover:text-slate-800 disabled:text-slate-300"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend the code"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}