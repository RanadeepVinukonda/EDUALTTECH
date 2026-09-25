"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import PasswordInput from "@/components/ui/PasswordInput";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !anon) {
        setError("Password reset is not configured yet.");
        return;
      }
      const supabase = createClient(url, anon);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const code = params.get("code");
      try {
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        } else if (hash.get("access_token")) {
          await supabase.auth.setSession({
            access_token: hash.get("access_token")!,
            refresh_token: hash.get("refresh_token") ?? "",
          });
        } else {
          setError("This reset link is incomplete or expired. Request a new one.");
          return;
        }
        setReady(true);
      } catch {
        setError("This reset link is invalid or expired. Request a new one.");
      }
    })();
  }, [params]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !anon) throw new Error("Password reset is not configured yet.");
      const supabase = createClient(url, anon);
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw new Error(error.message);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update your password");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="font-display text-2xl font-bold text-slate-900">Password updated</h1>
        <p className="mt-2 text-sm text-slate-600">You can sign in with your new password now.</p>
        <Link
          href="/login"
          replace
          className="mt-5 inline-block rounded-xl brand-grad px-6 py-2.5 font-semibold text-white hover:bg-brand-700"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="font-display text-2xl font-bold text-slate-900">Set a new password</h1>
      <p className="mt-1 text-sm text-slate-600">Choose a strong password you haven&apos;t used before.</p>

      {error && (
        <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          <p>{error}</p>
          {!error.includes("reset link") && (
            <Link href="/login" className="mt-2 inline-block font-medium text-slate-600 underline">
              Request a new link
            </Link>
          )}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">New password</label>
          <PasswordInput
            id="password"
            required
            disabled={!ready}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full"
            placeholder="8+ chars, a letter and a number"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-slate-700">Confirm password</label>
          <PasswordInput
            id="confirm"
            required
            disabled={!ready}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full"
            placeholder="Repeat your new password"
          />
        </div>
        <button
          type="submit"
          disabled={!ready || saving}
          className="w-full rounded-lg brand-grad py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {ready ? (saving ? "Updating…" : "Update password") : "Checking your link…"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md">
      <Suspense fallback={<div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-elev2">Loading…</div>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}