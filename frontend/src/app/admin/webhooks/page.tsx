"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface WebhookEvent {
  id: string;
  eventId: string;
  eventType: string;
  processed: boolean;
  receivedAt: string;
}

export default function AdminWebhooksPage() {
  const [events, setEvents] = useState<WebhookEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ events: WebhookEvent[] }>("/payments/webhook-events")
      .then((d) => setEvents(d.events))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Could not load webhook events"));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-ink-700">Webhook events</h1>
      <p className="mt-1 text-slate-600">
        Append-only Razorpay webhook ledger. Every event is stored once and never mutated.
      </p>

      {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!events.length && !error && <p className="mt-8 text-slate-500">Loading webhook events…</p>}
      {events.length === 0 && !error && (
        <p className="mt-10 rounded-2xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          No webhook events received yet.
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-5 py-3">Event</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Processed</th>
              <th className="px-5 py-3">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.map((e) => (
              <tr key={e.id}>
                <td className="px-5 py-3 font-mono text-xs text-slate-700">{e.eventId}</td>
                <td className="px-5 py-3 text-slate-700">{e.eventType}</td>
                <td className="px-5 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      e.processed ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {e.processed ? "Processed" : "Pending"}
                  </span>
                </td>
                <td className="px-5 py-3 text-slate-500">{new Date(e.receivedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}