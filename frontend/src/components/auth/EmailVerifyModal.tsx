"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { api, ApiError } from "@/lib/api";
import OtpVerifyCard from "@/components/ui/OtpVerifyCard";

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
  const autoSent = useRef(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (autoSent.current) return;
    autoSent.current = true;
    sendCode();
    // Opening the dialog is consent to send the code — no second click needed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    setSending(true);
    setError(null);
    try {
      const data = await api<{ message: string; devOtp?: string }>("/auth/send-email-code", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (data.devOtp) setCode(data.devOtp); // dev: pre-fill so the flow is testable headless
      setSent(true);
      setCountdown(60);
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
      setCode("");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-label="Verify email">
      <div className="w-full max-w-sm">
        <OtpVerifyCard
          title="Verify your email"
          subtitle={sending ? `Sending a 6-digit code to ${email}…` : sent ? `Check ${email} for the 6-digit code` : `We'll send a 6-digit code to ${email}`}
          value={code}
          onChange={setCode}
          onSubmit={verify}
          onBack={onClose}
          submitLabel={verifying ? "Checking…" : "Verify"}
          busy={verifying}
        />

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <div className="mt-3 flex justify-center gap-3 text-sm">
          {!sent ? (
            <button
              type="button"
              onClick={sendCode}
              disabled={sending}
              className="font-medium text-slate-500 hover:text-slate-800 disabled:text-slate-300"
            >
              {sending ? "Sending…" : "Send the code"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => sendCode()}
              disabled={sending || countdown > 0}
              className="font-medium text-slate-500 hover:text-slate-800 disabled:text-slate-300"
            >
              {countdown > 0 ? `Resend in ${countdown}s` : "Resend the code"}
            </button>
          )}
          <span className="text-slate-300">·</span>
          <button type="button" onClick={onClose} className="font-medium text-slate-500 hover:text-slate-800">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}