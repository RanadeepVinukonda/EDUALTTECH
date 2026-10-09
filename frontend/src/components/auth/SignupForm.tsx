"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost, ApiError } from "@/lib/api";
import { hasSession, safeNext } from "@/lib/auth";
import { setSignupEmail } from "@/lib/signup-flow";
import Button from "@/components/ui/Button";
import { TextField } from "./Field";
import OAuthButtons from "./OAuthButtons";

export default function SignupForm({ next }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ text: string; code?: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let active = true;
    hasSession().then((yes) => {
      if (active && yes) router.replace(safeNext(next));
    });
    return () => {
      active = false;
    };
  }, [next, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }
    setErrors({});
    setPending(true);
    try {
      const data = await apiPost<{ ok: true; devCode?: string }>(
        "/auth/send-email-code",
        { email: email.trim() },
        { auth: false },
      );
      setSignupEmail(email.trim(), next, data.devCode);
      router.push("/verify-email");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? { text: err.message, code: err.code }
          : { text: "We could not start registration right now. Please try again." },
      );
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
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
        <Button type="submit" className="w-full" loading={pending}>
          Continue
        </Button>
      </form>

      {error && (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <p>{error.text}</p>
          {error.code === "RATE_LIMITED" && <p className="mt-1">Please wait a moment before trying again.</p>}
        </div>
      )}

      <p className="text-center text-sm text-ink-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
