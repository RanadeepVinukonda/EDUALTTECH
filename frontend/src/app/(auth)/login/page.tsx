"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, persistAuthTokens, nextAuthPath, type AuthResponse } from "@/lib/api";
import PasswordInput from "@/components/ui/PasswordInput";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const created = searchParams.get("created");
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      persistAuthTokens(data);
      router.push(nextAuthPath(data.user));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function onForgot(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setForgotMsg(null);
    setLoading(true);
    try {
      const data = await api<{ message: string }>("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setForgotMsg(data.message);
      setShowForgot(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset link");
    } finally {
      setLoading(false);
    }
  }

  async function onOAuth(provider: "google" | "microsoft") {
    setError(null);
    try {
      const data = await api<{ url: string }>("/auth/oauth/url", {
        method: "POST",
        body: JSON.stringify({ provider }),
      });
      if (!data.url) throw new Error("That provider is not configured yet");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} sign-in failed`);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="font-display text-2xl font-bold text-slate-900">Welcome back</h1>
      <p className="mt-1 text-sm text-slate-600">Sign in to your Edu-Alt-Tech account.</p>

      {created && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">
          Account created — your email is verified. Welcome aboard, sign in to continue.
        </p>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <p>{error}</p>
          {error.toLowerCase().includes("verify your email") && (
            <Link href={`/verify-email?email=${encodeURIComponent(email)}`} className="mt-1 inline-block font-semibold text-red-800 underline">
              Resend the confirmation link
            </Link>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
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
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">Password</label>
          <PasswordInput
            id="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
            placeholder="••••••••"
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => { setForgotMsg(null); setShowForgot((v) => !v); }}
            className="font-medium text-brand-700 hover:text-brand-800"
          >
            Forgot password?
          </button>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg brand-grad py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {showForgot && !forgotMsg && (
        <form onSubmit={onForgot} className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">Reset your password</p>
          <p className="mt-1 text-xs text-slate-500">We&apos;ll email you a secure reset link.</p>
          <button
            type="submit"
            disabled={loading}
            className="mt-3 w-full rounded-lg bg-slate-800 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      {forgotMsg && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{forgotMsg}</p>
      )}

      <div className="mt-6">
        <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-slate-400">
          <span className="h-px flex-1 bg-slate-200" /> or continue with <span className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onOAuth("google")}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Google
          </button>
          <button
            type="button"
            onClick={() => onOAuth("microsoft")}
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Microsoft
          </button>
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        New here?{" "}
        <Link href="/register" className="font-semibold text-brand-700 hover:text-brand-800">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-elev2">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
