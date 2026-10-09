"use client";

import { useState } from "react";
import Link from "next/link";
import { apiPost, ApiError } from "@/lib/api";
import Button from "@/components/ui/Button";
import { TextField } from "./Field";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>("");
  const [fieldError, setFieldError] = useState<string>("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setFieldError("Enter a valid email address.");
      return;
    }
    setFieldError("");
    setPending(true);
    try {
      await apiPost("/auth/forgot-password", { email: email.trim() }, { auth: false });
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === "RATE_LIMITED"
          ? "Too many requests. Please wait a moment and try again."
          : "Something went wrong. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <p role="status" className="rounded-xl border border-green-300 bg-green-50 px-4 py-3 text-sm text-green-800">
          If an account exists for <span className="font-semibold">{email}</span>, we have sent a password reset
          link. Please check your inbox and spam or junk folder.
        </p>
        <p className="text-sm leading-relaxed text-ink-600">
          The link can only be used once and expires shortly. If it does not arrive, you can request another.
        </p>
        <div className="flex flex-col gap-3">
          <Button type="button" variant="secondary" onClick={() => setSent(false)}>
            Send again
          </Button>
          <Link href="/login" className="text-center text-sm font-semibold text-brand-700 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <p className="text-sm leading-relaxed text-ink-600">
        Enter the email address for your account and we will send you a link to reset your password.
      </p>
      <TextField
        label="Email address"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={email}
        error={fieldError}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button type="submit" className="w-full" loading={pending}>
        Send reset link
      </Button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <p className="text-center text-sm text-ink-600">
        Remembered it?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
