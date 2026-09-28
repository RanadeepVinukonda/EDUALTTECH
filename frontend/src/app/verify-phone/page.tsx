"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getCachedUser, nextAuthPath, updateCachedUser, type User } from "@/lib/api";
import { Loader } from "@/components/Loader";
import { useMinLoading } from "@/lib/useMinLoading";
import OtpVerifyCard from "@/components/ui/OtpVerifyCard";

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
  const loading = useMinLoading(user !== null);

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
      setOtp("");
    } finally {
      setBusy(false);
    }
  }

  function skip() {
    if (!user) return;
    router.push(nextAuthPath(user));
  }

  const skipBtn = (
    <button
      type="button"
      onClick={skip}
      className="mt-6 w-full rounded-[10px] bg-white py-3 font-medium text-slate-600 shadow-[1px_1px_3px_#b5b5b5,-1px_-1px_3px_#ffffff] transition hover:text-slate-900 active:shadow-[inset_2px_2px_4px_#b5b5b5,inset_-2px_-2px_4px_#ffffff]"
    >
      Skip for now — go to dashboard
    </button>
  );

  if (loading) return <Loader />;
  if (!user) return <Loader />;

  return (
    <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
      {step === "phone" ? (
        <div className="rounded-[20px] bg-white p-8 shadow-elev2">
          <p className="text-2xl font-bold tracking-tight text-slate-900">Verify your phone</p>
          <p className="mt-1 text-sm text-slate-600">We&apos;ll send a 6-digit code to confirm your number.</p>

          {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {message && !error && <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">{message}</p>}

          <form onSubmit={sendOtp} className="mt-6 space-y-4">
            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-slate-800">Mobile number</label>
              <div className="flex h-[50px] items-center rounded-[10px] border-[1.5px] border-slate-200 px-3 transition focus-within:border-brand-500">
                <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="7" y="2" width="10" height="20" rx="2" />
                  <path d="M11 18h2" strokeLinecap="round" />
                </svg>
                <input
                  id="phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="ml-2 h-full w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                  placeholder="Enter your mobile number"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-[10px] bg-slate-900 py-3 text-[15px] font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send code"}
            </button>
          </form>
        </div>
      ) : (
        <>
          <OtpVerifyCard
            title="Verify your phone"
            subtitle={`Enter the code sent for ${phone}.`}
            value={otp}
            onChange={setOtp}
            onSubmit={verifyOtp}
            onBack={() => setStep("phone")}
            submitLabel={busy ? "Verifying…" : "Verify phone"}
            busy={busy}
          />

          {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          {message && !error && <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">{message}</p>}
          {devOtp && (
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">Local dev only — code: {devOtp}</p>
          )}
        </>
      )}

      {skipBtn}
    </div>
  );
}