"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  scope: string;
  createdAt: string;
  sender: { name: string } | null;
}

const SCOPE_BADGE: Record<string, string> = {
  ALL: "bg-slate-100 text-slate-600",
  COURSE: "bg-brand-50 text-brand-700",
  USER: "bg-amber-50 text-amber-700",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ notifications: NotificationItem[] }>("/notifications")
      .then((d) => setNotifications(d.notifications))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Could not load notifications"));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-slate-900">Notifications</h1>
      <p className="mt-1 text-slate-600">Platform announcements and updates from your courses and mentors.</p>

      {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!error && notifications.length === 0 && (
        <p className="mt-10 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          Nothing here yet — announcements will land in this feed.
        </p>
      )}

      <ul className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
        {notifications.map((n) => (
          <li key={n.id} className="px-5 py-4">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-900">{n.title}</p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${SCOPE_BADGE[n.scope] ?? "bg-slate-100 text-slate-600"}`}>
                {n.scope === "ALL" ? "Everyone" : n.scope === "COURSE" ? "Course" : "Direct"}
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{n.body}</p>
            <p className="mt-2 text-xs text-slate-400">
              {n.sender ? `${n.sender.name} · ` : ""}
              {new Date(n.createdAt).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}