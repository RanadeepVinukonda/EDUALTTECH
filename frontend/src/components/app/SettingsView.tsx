"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiPost } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import MobileVerification from "./MobileVerification";
import { notifyError, notifySuccess } from "@/lib/notify";
import { formatDate } from "@/lib/format";
import Button, { buttonClass } from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import type { Me } from "@/lib/app-types";

export default function SettingsView() {
  const { user, loading, refresh, signOut } = useAuth();
  const router = useRouter();

  const [lifecycleBusy, setLifecycleBusy] = useState(false);

  if (loading || !user) return <Spinner label="Loading settings…" />;

  async function runLifecycle(action: "archive" | "cancel-archive" | "deactivate") {
    if (!user) return;
    const labels = {
      archive: "archive",
      "cancel-archive": "keep",
      deactivate: "deactivate",
    } as const;
    if (!confirm(`Are you sure you want to ${labels[action]} this account?`)) return;
    setLifecycleBusy(true);
    try {
      await apiPost<{ user: Me }>(`/auth/${action}`);
      await refresh();
      if (action === "deactivate") {
        await signOut();
        router.replace(`/reactivate?email=${encodeURIComponent(user.email)}&deactivated=1`);
        return;
      }
      notifySuccess(
        action === "archive"
          ? "Archived. Your account will be deactivated in 30 days unless you keep it."
          : "Account status updated.",
      );
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Could not update your account.");
    } finally {
      setLifecycleBusy(false);
    }
  }

  const archived = Boolean(user.deactivationScheduledAt) && user.isActive;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink-900">Account settings</h1>
        <p className="mt-1 text-[15px] text-slate-500">
          Manage your contact details and account status. Your learning profile lives on your profile page.
        </p>
      </header>

      <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1">
        <h2 className="font-display text-lg font-bold text-ink-900">Account</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-ink-700">Email</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-ink-700">Account type</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{user.role === "ADMIN" ? "Administrator" : "Member"}</dd>
          </div>
        </dl>
        <p className="mt-4 text-sm text-slate-500">
          Personal details and your learning profile are on the{" "}
          <Link href="/dashboard/profile" className="font-semibold text-brand-700 hover:underline">
            profile page
          </Link>
          .
        </p>
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1">
        <h2 className="font-display text-lg font-bold text-ink-900">Mobile number</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          Required to purchase paid courses or apply as a mentor. We only ask when you need it.
        </p>
        <MobileVerification />
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1">
        <h2 className="font-display text-lg font-bold text-ink-900">Account status</h2>

        {archived ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">
              This account is set to be deactivated on {formatDate(user.deactivationScheduledAt as string)}.
            </p>
            <p className="mt-1 text-amber-800">
              You can keep using EduAltTech until then. Cancel the archive to stay active, or deactivate now.
            </p>
          </div>
        ) : !user.isActive ? (
          <div className="mt-4 rounded-xl border border-danger/30 bg-danger/5 p-4 text-sm text-danger">
            <p className="font-semibold">This account is deactivated.</p>
            <p className="mt-1">
              Your data is kept. Re-enter your password on the{" "}
              <Link href={`/reactivate?email=${encodeURIComponent(user.email)}`} className="font-semibold underline">
                reactivation page
              </Link>{" "}
              to restore access.
            </p>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            Your account is active. You can archive it to schedule deactivation in 30 days, or deactivate it right away.
            Deactivated accounts keep their data and can be reactivated by signing in again.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {archived && (
            <Button size="sm" variant="secondary" loading={lifecycleBusy} onClick={() => void runLifecycle("cancel-archive")}>
              Keep my account
            </Button>
          )}
          {!archived && user.isActive && (
            <Button size="sm" variant="secondary" loading={lifecycleBusy} onClick={() => void runLifecycle("archive")}>
              Archive account
            </Button>
          )}
          {user.isActive && (
            <button
              type="button"
              className={buttonClass("ghost", "sm")}
              disabled={lifecycleBusy}
              onClick={() => void runLifecycle("deactivate")}
            >
              Deactivate account
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
