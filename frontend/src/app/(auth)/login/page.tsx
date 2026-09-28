"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, persistAuthTokens, nextAuthPath, type AuthResponse } from "@/lib/api";
import PasswordInput from "@/components/ui/PasswordInput";
import RememberCheckbox from "@/components/ui/RememberCheckbox";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const created = searchParams.get("created");
  const [email, setEmail] = useState(() => searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<"google" | "microsoft" | null>(null);
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
      persistAuthTokens(data, remember);
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
    setOauthBusy(provider);
    try {
      const data = await api<{ url: string }>("/auth/oauth/url", {
        method: "POST",
        body: JSON.stringify({ provider }),
      });
      if (!data.url) throw new Error("That provider is not configured yet");
      window.location.assign(data.url); // never returns; stay "busy" if it does
    } catch (err) {
      setError(err instanceof Error ? err.message : `${provider} sign-in failed`);
      setOauthBusy(null);
    }
  }

  const inputShell = "flex h-[50px] items-center rounded-[10px] border-[1.5px] border-slate-200 bg-white px-3 transition focus-within:border-brand-500";

  return (
    <div className="rounded-[20px] bg-white p-8 shadow-elev2">
      <p className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</p>
      <p className="mt-1 text-sm text-slate-600">Sign in to your EduAltTech account.</p>

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
          <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-800">Email</label>
          <div className={inputShell}>
            <svg viewBox="0 0 32 32" className="h-5 w-5 shrink-0 text-slate-400" fill="currentColor" aria-hidden="true">
              <path d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z" />
            </svg>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="ml-2 h-full w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              placeholder="Enter your Email"
            />
          </div>
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-semibold text-slate-800">Password</label>
          <PasswordInput
            id="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
            placeholder="Enter your Password"
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <RememberCheckbox id="remember" checked={remember} onChange={setRemember} label="Remember me" />
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
          className="w-full rounded-[10px] bg-slate-900 py-3 text-[15px] font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      {showForgot && !forgotMsg && (
        <form onSubmit={onForgot} className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">Reset your password</p>
          <p className="mt-1 text-xs text-slate-500">We&apos;ll email you a secure reset link.</p>
          <button
            type="submit"
            disabled={loading}
            className="mt-3 w-full rounded-[10px] bg-slate-900 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send reset link"}
          </button>
        </form>
      )}
      {forgotMsg && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{forgotMsg}</p>
      )}

      <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-wider text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> or continue with <span className="h-px flex-1 bg-slate-200" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onOAuth("google")}
          disabled={loading || oauthBusy !== null}
          className="flex h-[50px] items-center justify-center gap-2 rounded-[10px] border border-slate-200 bg-white font-medium text-slate-700 transition hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {oauthBusy === "google" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" aria-hidden="true" />
          ) : (
            <svg viewBox="0 0 512 512" className="h-5 w-5" aria-hidden="true">
              <path fill="#FBBB00" d="M113.47,309.408L95.648,375.94l-65.139,1.378C11.042,341.211,0,299.9,0,256c0-42.451,10.324-82.483,28.624-117.732h0.014l57.992,10.632l25.404,57.644c-5.317,15.501-8.215,32.141-8.215,49.456C103.821,274.792,107.225,292.797,113.47,309.408z"/>
              <path fill="#518EF8" d="M507.527,208.176C510.467,223.662,512,239.655,512,256c0,18.328-1.927,36.206-5.598,53.451c-12.462,58.683-45.025,109.925-90.134,146.187l-0.014-0.014l-73.044-3.727l-10.338-64.535c29.932-17.554,53.324-45.025,65.646-77.911h-136.89V208.176h138.887L507.527,208.176L507.527,208.176z"/>
              <path fill="#28B446" d="M416.253,455.624l0.014,0.014C372.396,490.901,316.666,512,256,512c-97.491,0-182.252-54.491-225.491-134.681l82.961-67.91c21.619,57.698,77.278,98.771,142.53,98.771c28.047,0,54.323-7.582,76.87-20.818L416.253,455.624z"/>
              <path fill="#F14336" d="M419.404,58.936l-82.933,67.896c-23.335-14.586-50.919-23.012-80.471-23.012c-66.729,0-123.429,42.957-143.965,102.724l-83.397-68.276h-0.014C71.23,56.123,157.06,0,256,0C318.115,0,375.068,22.126,419.404,58.936z"/>
            </svg>
          )}
          {oauthBusy === "google" ? "Opening Google…" : "Google"}
        </button>
        <button
          type="button"
          onClick={() => onOAuth("microsoft")}
          disabled={loading || oauthBusy !== null}
          className="flex h-[50px] items-center justify-center gap-2 rounded-[10px] border border-slate-200 bg-white font-medium text-slate-700 transition hover:border-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {oauthBusy === "microsoft" ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" aria-hidden="true" />
          ) : (
            <svg viewBox="0 0 21 21" className="h-4 w-4" aria-hidden="true">
              <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
              <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
              <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
            </svg>
          )}
          {oauthBusy === "microsoft" ? "Opening Microsoft…" : "Microsoft"}
        </button>
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