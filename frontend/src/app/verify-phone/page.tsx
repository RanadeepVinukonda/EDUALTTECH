"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getCachedUser, nextAuthPath, updateCachedUser, type User } from "@/lib/api";

export default function VerifyPhonePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const cached = getCachedUser();
    if (!cached) {
      router.replace("/login");
      return;
    }
    if (!cached.emailVerifiedAt) {
      router.replace("/verify-email");
      return;
    }
    if (cached.phoneVerifiedAt) {
      router.replace(nextAuthPath(cached));
      return;
    }
    setUser(cached);
  }, [router]);

  async function sendOtp(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const data = await api<{ message: string; devOtp?: string }>("/auth/phone/send-otp", {
        method: "POST",
        body: JSON.stringify({ phone }),
      });
      setStep("otp");
      setMessage(data.message);
      setDevOtp(data.devOtp ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the code");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const data = await api<{ user: User }>("/auth/phone/verify-otp", {
        method: "POST",
        body: JSON.stringify({ otp }),
      });
      updateCachedUser(data.user);
      router.push(nextAuthPath(data.user));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <div className="mx-auto max-w-md px-4 py-16 text-slate-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="font-display text-2xl font-bold text-slate-900">Verify your phone</h1>
        <p className="mt-1 text-sm text-slate-600">
          {step === "phone" ? "We'll send a 6-digit code to confirm your number." : `Enter the code sent for ${phone}.`}
        </p>

        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {message && !error && <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">{message}</p>}
        {devOtp && (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">Local dev only — code: {devOtp}</p>
        )}

        {step === "phone" ? (
          <form onSubmit={sendOtp} className="mt-6 space-y-4">
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">Mobile number</label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="+91 98765 43210"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send code"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="mt-6 space-y-4">
            <div>
              <label htmlFor="otp" className="mb-1 block text-sm font-medium text-slate-700">6-digit code</label>
              <input
                id="otp"
                inputMode="numeric"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-[0.4em] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                placeholder="000000"
              />
            </div>
            <button
              type="submit"
              disabled={busy || otp.length !== 6}
              className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? "Verifying…" : "Verify phone"}
            </button>
            <button type="button" onClick={() => setStep("phone")} className="w-full text-sm text-slate-500 hover:text-slate-700">
              Use a different number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}