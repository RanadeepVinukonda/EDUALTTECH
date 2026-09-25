"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

interface AdminStats {
  users: number;
  admins: number;
  providers: number;
  courses: number;
  enrollments: number;
  unreadMessages: number;
  paidOrders: number;
  trialOrders: number;
  resources: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<AdminStats>("/admin/stats")
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink-700">Admin dashboard</h1>
      <p className="mt-1 text-slate-600">Courses, users, enrollments, payments and messages — the whole platform.</p>

      {error && <div className="mt-8 rounded-xl bg-red-50 p-4 text-red-700">{error}</div>}
      {!stats && !error && <p className="mt-8 text-slate-500">Loading platform stats…</p>}

      {stats && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Users" value={stats.users} />
            <Stat label="Admins" value={stats.admins} />
            <Stat label="Course mentors" value={stats.providers} />
            <Stat label="Courses" value={stats.courses} />
            <Stat label="Enrollments" value={stats.enrollments} />
            <Stat label="Paid (full plan)" value={stats.paidOrders} />
            <Stat label="Resources" value={stats.resources} />
            <Stat label="Unread messages" value={stats.unreadMessages} highlight={stats.unreadMessages > 0} />
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <AdminLinkCard href="/admin/users" title="Users" body="Manage accounts, admins and access." />
            <AdminLinkCard href="/admin/applications" title="Mentor applications" body="Review, interview and approve mentors." />
            <AdminLinkCard href="/admin/courses" title="Courses & mentors" body="Assign or remove mentors on any course." />
            <AdminLinkCard href="/admin/messages" title="Contact messages" body="Schools reaching out via the site form." />
            <AdminLinkCard href="/admin/orders" title="Orders" body="Razorpay ledger — payments, plans and refunds." />
            <AdminLinkCard href="/admin/webhooks" title="Webhook events" body="Append-only Razorpay event trail." />
            <AdminLinkCard href="/admin/settings" title="Platform settings" body="Keys, defaults and impact numbers." />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${highlight ? "border-brand-300 bg-m3-surface-alt" : "border-slate-200 bg-white"}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="font-display mt-1 text-3xl font-bold text-ink-700">{value}</p>
    </div>
  );
}

function AdminLinkCard({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link href={href} className="rounded-2xl border border-slate-200 bg-white p-6 hover:border-brand-300 hover:shadow-sm">
      <p className="font-display text-lg font-semibold text-ink-700">{title}</p>
      <p className="mt-1 text-sm text-slate-600">{body}</p>
    </Link>
  );
}
