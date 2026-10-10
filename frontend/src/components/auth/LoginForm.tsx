"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost, ApiError } from "@/lib/api";
import { hasSession, safeNext, setSessionFromTokens, type AuthTokens } from "@/lib/auth";
import Button from "@/components/ui/Button";
import { PasswordField, TextField } from "./Field";
import OAuthButtons from "./OAuthButtons";

interface LoginResult extends AuthTokens {
  user: { id: string; email: string; role: string; emailVerifiedAt: boolean };
}

export default function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ text: string; code?: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    hasSession().then((yes) => {
      if (active && yes) router.replace(safeNext(next, "/dashboard"));
    });
    return () => {
      active = false;
    };
  }, [next, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const errs: Record<string, string> = {};
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) errs.email = "Enter a valid email address.";
    if (password.length < 1) errs.password = "Enter your password.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setPending(true);
    try {
      const data = await apiPost<LoginResult>(
        "/auth/login",
        { email: email.trim(), password },
        { auth: false },
      );
      await setSessionFromTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      router.replace(safeNext(next));
    } catch (err) {
      if (err instanceof ApiError) setError({ text: err.message, code: err.code });
      else setError({ text: "Something went wrong. Please try again." });
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      {notice && (
        <p role="status" className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          {notice}
        </p>
      )}
      <OAuthButtons next={next} />
      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
        <span className="h-px flex-1 bg-slate-200" /> or <span className="h-px flex-1 bg-slate-200" />
      </div>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <TextField
          label="Email address"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          error={errors.email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            value={password}
            error={errors.password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="mt-2 text-right">
            <Link href="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>
        <Button type="submit" className="w-full" loading={pending}>
          Sign in
        </Button>
      </form>

      {error && (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <p>{error.text}</p>
          {error.code === "EMAIL_NOT_VERIFIED" && (
            <p className="mt-1">
              <Link href="/signup" className="font-semibold underline">
                Finish creating your account
              </Link>
            </p>
          )}
        </div>
      )}

      <p className="text-center text-sm text-ink-600">
        New to EduAltTech?{" "}
        <Link href="/signup" className="font-semibold text-brand-700 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
