"use client";

import { useState } from "react";
import { apiPost } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { notifyError, notifySuccess } from "@/lib/notify";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function MobileVerification() {
  const { user, refresh } = useAuth();
  const [mobile, setMobile] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const verified = Boolean(user?.mobileVerifiedAt);

  async function send() {
    const value = mobile.trim();
    if (!/^\+?\d{8,15}$/.test(value)) {
      notifyError("Enter a valid mobile number (digits only, optional +).");
      return;
    }
    setSending(true);
    try {
      const res = await apiPost<{ ok?: boolean; devCode?: string }>("/auth/phone/send-otp", { mobile: value });
      setSent(true);
      setDevCode(res.devCode ?? null);
      await refresh();
      notifySuccess("We sent you a 6-digit code.");
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Could not send the code.");
    } finally {
      setSending(false);
    }
  }

  async function verify() {
    if (!/^\d{6}$/.test(code.trim())) {
      notifyError("Enter the 6-digit code.");
      return;
    }
    setVerifying(true);
    try {
      await apiPost("/auth/phone/verify-otp", { code: code.trim() });
      await refresh();
      setSent(false);
      setCode("");
      setDevCode(null);
      notifySuccess("Mobile number verified.");
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Incorrect code.");
    } finally {
      setVerifying(false);
    }
  }

  if (verified) {
    return (
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">Verified</span>
        <span className="text-sm text-ink-700">{user?.mobile}</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {user?.mobile && !sent && (
        <p className="text-sm text-slate-500">
          Current: {user.mobile} — not verified. Verify to unlock purchases and mentor applications.
        </p>
      )}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1">
          <label htmlFor="mv-mobile" className="mb-1 block text-sm font-semibold text-ink-700">
            Mobile number
          </label>
          <Input
            id="mv-mobile"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            placeholder="+919876543210"
          />
        </div>
        <Button onClick={() => void send()} loading={sending}>
          {sent ? "Resend code" : "Send code"}
        </Button>
      </div>

      {sent && (
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px] flex-1">
            <label htmlFor="mv-code" className="mb-1 block text-sm font-semibold text-ink-700">
              6-digit code
            </label>
            <Input
              id="mv-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022"
            />
          </div>
          <Button onClick={() => void verify()} loading={verifying}>
            Verify
          </Button>
        </div>
      )}

      {devCode && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Dev mode — use code <strong>{devCode}</strong>.
        </p>
      )}
    </div>
  );
}
