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
    password: "",
  });
  const [emailVerified, setEmailVerified] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const canSubmit =
    emailVerified &&
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    form.password.length >= 8;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim(),
          password: form.password,
        }),
      });
      router.push("/login?created=1&email=" + encodeURIComponent(form.email.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[20px] bg-white p-8 shadow-elev2">
      <h1 className="font-display text-2xl font-bold text-ink-700">Create your account</h1>
      <p className="mt-1 text-sm text-slate-600">
        Join free — start learning in minutes. Want to mentor? Pick a course and apply right from its page.
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
              className="w-full rounded-[10px] border-[1.5px] border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 placeholder:text-slate-400"
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
              className="w-full rounded-[10px] border-[1.5px] border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-800">Email</label>
          <div className="flex gap-2">
            <div className="flex h-[50px] flex-1 items-center rounded-[10px] border-[1.5px] border-slate-200 px-3 transition focus-within:border-brand-500">
              <svg viewBox="0 0 32 32" className="h-5 w-5 shrink-0 text-slate-400" fill="currentColor" aria-hidden="true">
                <path d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a2 2 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z" />
              </svg>
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
                className={`ml-2 h-full w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60 ${
                  emailVerified ? "text-emerald-800" : ""
                }`}
              />
            </div>
            <button
              type="button"
              disabled={!emailValid || emailVerified}
              onClick={() => setShowVerify(true)}
              className={`shrink-0 rounded-[10px] px-4 text-sm font-medium transition disabled:opacity-50 ${
                emailVerified ? "bg-emerald-100 text-emerald-800" : "bg-slate-900 text-white hover:bg-slate-800"
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
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            Password
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
          className="w-full rounded-[10px] bg-slate-900 py-3 text-[15px] font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
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