"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { clearSession, PASSWORD_MIN_LENGTH } from "@/lib/auth";
import Button from "@/components/ui/Button";
import LinkButton from "@/components/ui/LinkButton";
import Spinner from "@/components/ui/Spinner";
import { PasswordField } from "./Field";

export default function ResetPasswordForm() {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "ready" | "invalid">("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const settled = useRef(false);

  useEffect(() => {
    const sb = getSupabase();
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (session && !settled.current) {
        settled.current = true;
        setState("ready");
      }
    });
    // detectSessionInUrl processes the recovery/magic-link hash on load.
    const timer = setTimeout(async () => {
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!settled.current) {
        settled.current = true;
        setState(session ? "ready" : "invalid");
      }
    }, 700);
    return () => {
      clearTimeout(timer);
      sub.subscription.unsubscribe();
    };
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const errs: Record<string, string> = {};
    if (password.length < PASSWORD_MIN_LENGTH) errs.password = `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
    if (confirm !== password) errs.confirm = "Passwords do not match.";
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setPending(true);
    const { error: updateError } = await getSupabase().auth.updateUser({ password });
    if (updateError) {
      setError("We could not update your password. The link may have expired. Please request a new one.");
      setPending(false);
      return;
    }
    await clearSession();
    router.replace("/login?reset=1");
  }

  if (state === "checking") return <Spinner label="Checking your reset link…" />;

  if (state === "invalid") {
    return (
      <div className="space-y-4">
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          This password reset link is invalid, expired, or has already been used.
        </p>
        <LinkButton href="/forgot-password" className="w-full">
          Request a new link
        </LinkButton>
        <p className="text-center text-sm text-ink-600">
          <Link href="/login" className="font-semibold text-brand-700 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        value={password}
        error={errors.password}
        showRequirements
        onChange={(e) => setPassword(e.target.value)}
      />
      <PasswordField
        label="Confirm new password"
        name="confirm"
        autoComplete="new-password"
        value={confirm}
        error={errors.confirm}
        onChange={(e) => setConfirm(e.target.value)}
      />
      <Button type="submit" className="w-full" loading={pending}>
        Update password
      </Button>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}
