"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ApiError, apiPost } from "@/lib/api";
import type { AdminUserRow, Role } from "@/lib/app-types";
import Input from "@/components/ui/Input";
import Button, { buttonClass } from "@/components/ui/Button";
import { notifySuccess } from "@/lib/notify";

function inviteError(err: ApiError): string {
  switch (err.code) {
    case "EMAIL_TAKEN":
      return "An account with this email already exists.";
    case "VALIDATION_ERROR":
      return err.message || "Please check the details and try again.";
    case "FORBIDDEN":
      return "You don’t have permission to create accounts.";
    case "UNAUTHORIZED":
      return "Your session expired. Please sign in again.";
    case "RATE_LIMITED":
      return "Too many attempts. Please try again in a moment.";
    default:
      return err.message || "Could not create the account.";
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InviteUserDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<Role>("USER");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<AdminUserRow | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setCreated(null);
    setEmail("");
    setFirstName("");
    setLastName("");
    setRole("USER");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const valid = EMAIL_RE.test(email.trim()) && firstName.trim().length >= 1 && lastName.trim().length >= 1;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || !valid) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiPost<{ user: AdminUserRow }>("/admin/users", {
        email: email.trim().toLowerCase(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role,
      });
      setCreated(res.user);
      notifySuccess("Invitation sent");
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? inviteError(err) : "Could not create the account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-title"
        className="w-full max-w-md rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev3"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="invite-title" className="font-display text-xl font-bold text-ink-900">
          Invite a user
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          The server sends a secure invitation email so the user sets their own password. No password is set here.
        </p>

        {created ? (
          <div className="mt-5 space-y-4">
            <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Invitation sent to <strong>{created.email}</strong> as <strong>{created.role}</strong>.
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/dashboard/admin/users/${created.id}?email=${encodeURIComponent(created.email)}`}
                className={buttonClass("primary", "sm")}
              >
                Open user
              </Link>
              <Button variant="secondary" size="sm" onClick={() => setCreated(null)}>
                Invite another
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div>
              <label htmlFor="invite-email" className="mb-1 block text-sm font-semibold text-ink-700">
                Email
              </label>
              <Input
                id="invite-email"
                type="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={email.length > 0 && !EMAIL_RE.test(email.trim())}
                placeholder="name@example.com"
                required
              />
              {email.length > 0 && !EMAIL_RE.test(email.trim()) && (
                <p className="mt-1 text-xs text-red-600">Enter a valid email address.</p>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="invite-first" className="mb-1 block text-sm font-semibold text-ink-700">
                  First name
                </label>
                <Input id="invite-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} maxLength={80} required />
              </div>
              <div>
                <label htmlFor="invite-last" className="mb-1 block text-sm font-semibold text-ink-700">
                  Last name
                </label>
                <Input id="invite-last" value={lastName} onChange={(e) => setLastName(e.target.value)} maxLength={80} required />
              </div>
            </div>
            <div>
              <label htmlFor="invite-role" className="mb-1 block text-sm font-semibold text-ink-700">
                Account role
              </label>
              <select
                id="invite-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
              >
                <option value="USER">USER</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              <p className="mt-1 text-xs text-slate-500">
                MENTOR and LEARNER are course-specific roles and can’t be assigned here.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={submitting} disabled={!valid}>
                Send invitation
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
