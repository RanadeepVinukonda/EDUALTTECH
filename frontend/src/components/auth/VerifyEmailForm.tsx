"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost, ApiError } from "@/lib/api";
import { hasSession, safeNext } from "@/lib/auth";
import { getSignupFlow, setSignupEmail, setVerifiedCode } from "@/lib/signup-flow";
import Button from "@/components/ui/Button";
import { TextField } from "./Field";

const emailRe = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  const shown = local.slice(0, 1);
  return `${shown}${"*".repeat(Math.max(local.length - 1, 1))}@${domain}`;
}

export default function VerifyEmailForm({ emailFromQuery, next }: { emailFromQuery?: string; next?: string }) {
  const router = useRouter();
  const flow = getSignupFlow();
  const initialEmail = flow.email || emailFromQuery || "";

  const [email, setEmail] = useState(initialEmail);
  const [emailLocked, setEmailLocked] = useState(Boolean(initialEmail));
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState(flow.devCode ?? "");
  const [pending, setPending] = useState(false);
  const [resending, setResending] = useState(false);
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

  async function sendCode(targetEmail: string) {
    setError(null);
    setResending(true);
    try {
      const data = await apiPost<{ ok: true; devCode?: string }>(
        "/auth/send-email-code",
        { email: targetEmail.trim() },
        { auth: false },
      );
      setDevCode(data.devCode ?? "");
      setSignupEmail(targetEmail.trim(), next ?? flow.next, data.devCode);
      setEmailLocked(true);
    } catch (err) {
      setError(toError(err, "We could not send a code right now. Please try again."));
    } finally {
      setResending(false);
    }
  }

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    if (!emailRe.test(email.trim())) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }
    setErrors({});
    await sendCode(email);
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.trim().length < 4) {
      setErrors({ code: "Enter the code from your email." });
      return;
    }
    setErrors({});
    setPending(true);
    try {
      await apiPost("/auth/verify-email-code", { email: email.trim(), code: code.trim() }, { auth: false });
      setVerifiedCode(code.trim());
      router.push("/complete-registration");
    } catch (err) {
      setError(toError(err, "That code could not be verified. Request a new one and try again."));
      setPending(false);
    }
  }

  // No email to verify and none supplied — send them to start.
  if (!email) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-ink-600">
          We do not have an email to verify. Start by creating your account.
        </p>
        <Link href="/signup" className="block font-semibold text-brand-700 hover:underline">
          Go to sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-ink-600">
        Email verification is required. We sent a code to{" "}
        <span className="font-semibold text-ink-900" title={email}>
          {maskEmail(email)}
        </span>
        . Enter it below to prove the address is yours.
      </p>

      {!emailLocked && (
        <form onSubmit={requestCode} className="space-y-4" noValidate>
          <TextField
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            error={errors.email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button type="submit" className="w-full" loading={resending}>
            Send verification code
          </Button>
        </form>
      )}

      {emailLocked && (
        <>
          {devCode && (
            <p className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Development mode: use code <span className="font-mono font-bold">{devCode}</span>.
            </p>
          )}
          <form onSubmit={verify} className="space-y-4" noValidate>
            <TextField
              label="Verification code"
              name="code"
              autoComplete="one-time-code"
              inputMode="numeric"
              placeholder="Enter code"
              value={code}
              maxLength={8}
              error={errors.code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Button type="submit" className="w-full" loading={pending}>
              Verify email
            </Button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => sendCode(email)}
              disabled={resending}
              className="font-semibold text-brand-700 hover:underline disabled:opacity-50"
            >
              {resending ? "Sending…" : "Resend code"}
            </button>
            <button
              type="button"
              onClick={() => {
                setEmailLocked(false);
                setDevCode("");
              }}
              className="text-ink-600 hover:text-ink-900"
            >
              Change email
            </button>
          </div>
        </>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <p>{error.text}</p>
          {error.code === "RATE_LIMITED" && <p className="mt-1">Please wait a moment before trying again.</p>}
        </div>
      )}

      <p className="text-center text-sm text-ink-600">
        Already verified?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

function toError(e: unknown, fallback: string): { text: string; code?: string } {
  if (e instanceof ApiError) return { text: e.message, code: e.code };
  return { text: fallback };
}
