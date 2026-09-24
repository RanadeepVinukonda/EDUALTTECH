"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import PasswordInput from "@/components/ui/PasswordInput";
import EmailVerifyModal from "@/components/auth/EmailVerifyModal";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [emailVerified, setEmailVerified] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const phoneValid = form.phone === "" || /^\+?\d{7,15}$/.test(form.phone.replace(/[\s-()]/g, ""));
  const canSubmit =
    emailVerified &&
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    form.password.length >= 8 &&
    phoneValid;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: Record<string, string> = { firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim() };
      if (form.phone.trim()) payload.phone = form.phone.trim();
      payload.password = form.password;

      await api("/auth/register", { method: "POST", body: JSON.stringify(payload) });

      // Email is already verified by code, so straight to sign-in.
      router.push("/login?created=1&email=" + encodeURIComponent(form.email.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-elev2">
      <h1 className="font-display text-2xl font-bold text-ink-700">Create your account</h1>
      <p className="mt-1 text-sm text-slate-600">
        Join free — start learning in minutes. Want to mentor a course later? Apply{" "}
        <Link href="/teachers/apply" className="font-semibold text-brand-700 hover:text-brand-800">
          here
        </Link>
        .
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-slate-700">First name</label>
            <input
              id="firstName"
              required
              placeholder="Ravi"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-slate-700">Last name</label>
            <input
              id="lastName"
              required
              placeholder="Kumar"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <div className="flex gap-2">
            <input
              id="email"
              type="email"
              required
              placeholder="you@school.in"
              value={form.email}
              disabled={emailVerified}
              onChange={(e) => {
                setForm((f) => ({ ...f, email: e.target.value }));
                setEmailVerified(false);
              }}
              className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50 ${
                emailVerified ? "border-emerald-400 bg-emerald-50 text-emerald-900" : "border-slate-300 focus:border-brand-500"
              }`}
            />
            <button
              type="button"
              disabled={!emailValid || emailVerified}
              onClick={() => setShowVerify(true)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                emailVerified ? "bg-emerald-100 text-emerald-800" : "bg-brand-600 text-white hover:bg-brand-700"
              }`}
            >
              {emailVerified ? "Verified ✓" : "Verify"}
            </button>
          </div>
          {emailVerified && (
            <p className="mt-1 text-xs text-emerald-700">Email confirmed. You&apos;re all set to create the account.</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">Phone (optional)</label>
          <div className="flex gap-2">
            <input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
            <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-400">
              OTP coming soon
            </span>
          </div>
          {!phoneValid && <p className="mt-1 text-xs text-red-600">Enter a valid mobile number</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            Password (min 8 characters, one letter + one number)
          </label>
          <PasswordInput
            id="password"
            required
            minLength={8}
            placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            className="w-full"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !canSubmit}
          className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          Sign in
        </Link>
      </p>

      {showVerify && (
        <EmailVerifyModal
          email={form.email.trim()}
          onVerified={() => {
            setEmailVerified(true);
            setShowVerify(false);
          }}
          onClose={() => setShowVerify(false)}
        />
      )}
    </div>
  );
}