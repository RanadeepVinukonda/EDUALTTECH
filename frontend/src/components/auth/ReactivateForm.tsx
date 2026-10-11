"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost, ApiError } from "@/lib/api";
import { setSessionFromTokens, type AuthTokens } from "@/lib/auth";
import { notifySuccess } from "@/lib/notify";
import Button from "@/components/ui/Button";
import { PasswordField, TextField } from "./Field";

interface ReactivateResult extends AuthTokens {
  user: { email: string; isActive: boolean };
}

export default function ReactivateForm({ email: initialEmail }: { email?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail ?? "");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialEmail) setEmail(initialEmail);
  }, [initialEmail]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 1) {
      setError("Enter your password.");
      return;
    }
    setPending(true);
    try {
      const data = await apiPost<ReactivateResult>(
        "/auth/reactivate",
        { email: email.trim(), password },
        { auth: false },
      );
      await setSessionFromTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      notifySuccess("Your account has been reactivated.");
      router.replace("/dashboard/settings");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Something went wrong. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
        Your account was deactivated, but your data is safe. Reactivate with your email and password to pick up where
        you left off.
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
          onChange={(e) => setEmail(e.target.value)}
        />
        <PasswordField label="Password" name="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" className="w-full" loading={pending}>
          Reactivate my account
        </Button>
      </form>

      {error && (
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <p className="text-center text-sm text-ink-600">
        Not ready to reactivate?{" "}
        <Link href="/" className="font-semibold text-brand-700 hover:underline">
          Continue to the site
        </Link>
      </p>
    </div>
  );
}