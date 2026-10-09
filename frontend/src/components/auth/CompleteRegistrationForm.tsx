"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost, ApiError } from "@/lib/api";
import { hasSession, PASSWORD_MIN_LENGTH, safeNext, setSessionFromTokens, type AuthTokens } from "@/lib/auth";
import { clearSignupFlow, getSignupFlow } from "@/lib/signup-flow";
import Button from "@/components/ui/Button";
import { PasswordField, TextField } from "./Field";

interface RegisterResult extends AuthTokens {
  user: { id: string; email: string; role: string };
}

export default function CompleteRegistrationForm() {
  const router = useRouter();
  const flow = getSignupFlow();
  // The verified email + code live in memory only; a refresh loses them.
  const ready = flow.verified && Boolean(flow.email) && Boolean(flow.code);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ text: string; code?: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (ready) return;
    let active = true;
    hasSession().then((yes) => {
      if (active && yes) router.replace("/");
    });
    return () => {
      active = false;
    };
  }, [ready, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const errs: Record<string, string> = {};
    if (firstName.trim().length < 1) errs.firstName = "Enter your first name.";
    if (lastName.trim().length < 1) errs.lastName = "Enter your last name.";
    if (password.length < PASSWORD_MIN_LENGTH) errs.password = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
    if (confirm !== password) errs.confirm = "Passwords do not match.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setPending(true);
    try {
      const data = await apiPost<RegisterResult>(
        "/auth/register",
        {
          email: flow.email,
          code: flow.code,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          password,
        },
        { auth: false },
      );
      await setSessionFromTokens({ accessToken: data.accessToken, refreshToken: data.refreshToken });
      clearSignupFlow();
      router.replace(safeNext(flow.next));
    } catch (err) {
      if (err instanceof ApiError) setError({ text: err.message, code: err.code });
      else setError({ text: "We could not complete your registration. Please try again." });
      setPending(false);
    }
  }

  if (!ready) {
    return (
      <div className="space-y-4">
        <p role="alert" className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Your verification session has expired. For your security you need to verify your email again before
          finishing registration.
        </p>
        <Link
          href="/verify-email"
          className="block text-center font-semibold text-brand-700 hover:underline"
        >
          Verify your email again
        </Link>
        <p className="text-center text-sm text-ink-600">
          <Link href="/signup" className="font-semibold text-brand-700 hover:underline">
            Start over
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm leading-relaxed text-ink-600">
        Last step — add your name and choose a password to finish creating your account for{" "}
        <span className="font-semibold text-ink-900">{flow.email}</span>.
      </p>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="First name"
            name="firstName"
            autoComplete="given-name"
            value={firstName}
            error={errors.firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <TextField
            label="Last name"
            name="lastName"
            autoComplete="family-name"
            value={lastName}
            error={errors.lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          value={password}
          error={errors.password}
          showRequirements
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordField
          label="Confirm password"
          name="confirm"
          autoComplete="new-password"
          value={confirm}
          error={errors.confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        <Button type="submit" className="w-full" loading={pending}>
          Complete registration
        </Button>
      </form>

      {error && (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          <p>{error.text}</p>
          {error.code === "EMAIL_TAKEN" && (
            <p className="mt-1">
              <Link href="/login" className="font-semibold underline">
                Sign in instead
              </Link>
            </p>
          )}
          {error.code === "VALIDATION" && (
            <p className="mt-1">
              Your code may have expired.{" "}
              <Link href="/verify-email" className="font-semibold underline">
                Verify again
              </Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
