"use client";

import Link from "next/link";
import Block from "@mui/icons-material/Block";
import { buttonClass } from "@/components/ui/Button";

/**
 * Access-denied panel for authenticated users who lack permission.
 * Never used for unauthenticated users (those are redirected to sign-in) or
 * for missing resources (those use not-found). Backend authz is authoritative.
 */
export default function AccessDenied({
  title = "You don’t have access",
  description = "Your account doesn’t have permission to view this page. If you believe this is a mistake, contact support.",
  actions = true,
}: {
  title?: string;
  description?: string;
  actions?: boolean;
}) {
  return (
    <div
      role="alert"
      className="mx-auto flex max-w-lg flex-col items-center rounded-[20px] border border-slate-200 bg-white px-6 py-14 text-center shadow-elev1"
    >
      <span aria-hidden className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
        <Block />
      </span>
      <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">{title}</h1>
      <p className="mt-2 text-[15px] text-ink-600">{description}</p>
      {actions && (
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard" className={buttonClass("primary", "sm")}>
            Back to dashboard
          </Link>
          <Link href="/courses" className={buttonClass("secondary", "sm")}>
            Browse courses
          </Link>
        </div>
      )}
    </div>
  );
}
