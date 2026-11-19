"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import MarkEmailRead from "@mui/icons-material/MarkEmailRead";
import OpenInNew from "@mui/icons-material/OpenInNew";
import Refresh from "@mui/icons-material/Refresh";
import ArrowBack from "@mui/icons-material/ArrowBack";
import { apiPost, ApiError } from "@/lib/api";
import Button from "@/components/ui/Button";
import { TextField } from "./Field";

function getWebmailProvider(email: string): { name: string; url: string } | null {
  const domain = email.split("@")[1]?.toLowerCase().trim();
  if (!domain) return null;
  if (domain === "gmail.com" || domain === "googlemail.com") {
    return { name: "Open Gmail", url: "https://mail.google.com" };
  }
  if (domain === "outlook.com" || domain === "hotmail.com" || domain === "live.com") {
    return { name: "Open Outlook", url: "https://outlook.live.com" };
  }
  if (domain === "yahoo.com") {
    return { name: "Open Yahoo Mail", url: "https://mail.yahoo.com" };
  }
  if (domain === "icloud.com") {
    return { name: "Open iCloud Mail", url: "https://www.icloud.com/mail" };
  }
  return null;
}

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>("");
  const [fieldError, setFieldError] = useState<string>("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!fieldError) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [fieldError]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  async function sendResetRequest() {
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) {
      setFieldError("Enter a valid email address.");
      return;
    }
    setFieldError("");
    setError("");
    setPending(true);

    try {
      await apiPost("/auth/forgot-password", { email: email.trim() }, { auth: false });
      setSent(true);
      setResendCooldown(30);
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await sendResetRequest();
  }

  if (sent) {
    const webmail = getWebmailProvider(email);

    return (
      <div className="space-y-6">
        {/* Animated/Illustrated Success Header */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 text-brand-700 shadow-sm">
            <MarkEmailRead className="text-3xl" fontSize="large" />
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold tracking-tight text-ink-900">
            Check your inbox, learner!
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-600">
            If an account exists, we sent a secure reset link to:
          </p>
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50/80 px-3 py-1 font-mono text-xs font-semibold text-brand-900 break-all">
            {email}
          </div>
        </div>

        {/* Quick Webmail Shortcut Button */}
        {webmail && (
          <a
            href={webmail.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
          >
            <span>{webmail.name}</span>
            <OpenInNew fontSize="inherit" aria-hidden />
          </a>
        )}

        {/* 3-Step Student Checklist */}
        <div className="space-y-2.5 rounded-xl border border-slate-200 bg-paper-2/60 p-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-muted">
            Next Steps for Students
          </p>
          <div className="space-y-2 text-xs leading-relaxed text-ink-700">
            <div className="flex items-start gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-800">
                1
              </span>
              <span>Open the email from <strong>EduAltTech</strong>.</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-800">
                2
              </span>
              <span>Click the secure button inside (link is valid for 1 hour).</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-brand-800">
                3
              </span>
              <span>Create your new password and return to your digital classrooms.</span>
            </div>
          </div>
        </div>

        {/* Student Help & Tips Callout */}
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-3.5 text-xs text-amber-900 leading-relaxed">
          <p className="font-semibold text-amber-950">Can&apos;t find the email?</p>
          <p className="mt-1 text-amber-800/90">
            Check your <strong>Spam</strong> or <strong>Promotions</strong> folder. If you originally signed up with Google, you can sign in directly with Google on the login page.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-1">
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-center text-xs"
            disabled={resendCooldown > 0 || pending}
            loading={pending}
            onClick={sendResetRequest}
          >
            {resendCooldown > 0 ? (
              `Resend email in ${resendCooldown}s`
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <Refresh fontSize="inherit" />
                Resend email
              </span>
            )}
          </Button>

          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800 hover:underline"
          >
            <ArrowBack fontSize="inherit" aria-hidden />
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={submit} className="space-y-4" noValidate>
      <p className="text-sm leading-relaxed text-ink-600">
        Enter the email address associated with your student account and we will send you a one-time link to create a new password.
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
