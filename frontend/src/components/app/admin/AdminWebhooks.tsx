"use client";

import { useState } from "react";
import { apiGet } from "@/lib/api";
import type { WebhookEventRow } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { AdminHeader, Panel, Skeleton, StatusPill, useAsync } from "./admin-ui";

export default function AdminWebhooks() {
  const events = useAsync(() => apiGet<{ events: WebhookEventRow[] }>("/payments/webhook-events"), []);
  const [selected, setSelected] = useState<WebhookEventRow | null>(null);

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Payment webhook events"
        description="Append-only provider event trail. The backend returns the 50 most recent events; there is no filtering, pagination, or replay endpoint."
      />

      <Panel title="Recent events" description="Signature verification and payment fulfilment remain backend responsibilities.">
        {events.error ? (
          <ErrorState message={events.error} onRetry={events.reload} />
        ) : events.loading && !events.data ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : events.data && events.data.events.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-2 py-2 font-semibold">Event</th>
                  <th className="px-2 py-2 font-semibold">Provider ref</th>
                  <th className="px-2 py-2 font-semibold">Processing</th>
                  <th className="px-2 py-2 font-semibold">Received</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {events.data.events.map((e) => (
                  <tr key={e.id} className="align-top">
                    <td className="px-2 py-3">
                      <p className="font-semibold text-ink-900">{e.eventType}</p>
                      <p className="font-mono text-xs text-slate-500">{e.eventId}</p>
                    </td>
                    <td className="px-2 py-3 text-slate-600">{e.provider}</td>
                    <td className="px-2 py-3">
                      <StatusPill tone={e.processed ? "success" : "warn"}>{e.processed ? "processed" : "pending"}</StatusPill>
                    </td>
                    <td className="px-2 py-3 text-slate-600">{formatDate(e.receivedAt)}</td>
                    <td className="px-2 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(e)}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No webhook events" description="Provider events appear here once Razorpay starts delivering them." />
        )}
      </Panel>

      {selected && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4" role="presentation" onClick={() => setSelected(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wh-title"
            className="w-full max-w-lg rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev3"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="wh-title" className="font-display text-lg font-bold text-ink-900">
              Event detail
            </h2>
            <dl className="mt-3 grid gap-3 text-sm">
              <Row label="Event type" value={selected.eventType} />
              <Row label="Event id" value={selected.eventId} mono />
              <Row label="Provider" value={selected.provider} />
              <Row label="Processed" value={selected.processed ? "Yes" : "No"} />
              <Row label="Processed at" value={selected.processedAt ? formatDate(selected.processedAt) : "Not yet"} />
              <Row label="Received at" value={formatDate(selected.receivedAt)} />
            </dl>
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              The raw payload and signature are intentionally not rendered — they can contain payment and signing data.
              Use the backend logs if a deep inspection is required.
            </p>
            <div className="mt-5 text-right">
              <button
                type="button"
                autoFocus
                onClick={() => setSelected(null)}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className={mono ? "break-all text-right font-mono text-xs text-ink-900" : "text-right text-ink-900"}>{value}</dd>
    </div>
  );
}
