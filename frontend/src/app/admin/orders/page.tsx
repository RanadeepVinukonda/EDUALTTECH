"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface OrderRow {
  id: string;
  orderNumber: string;
  plan: "TRIAL" | "FULL";
  amountPaise: number;
  status: "CREATED" | "PAID" | "FAILED" | "REFUNDED";
  createdAt: string;
  user: { id: string; name: string; email: string };
}

interface OrdersData {
  items: OrderRow[];
  total: number;
  page: number;
  limit: number;
}

const STATUSES = ["", "CREATED", "PAID", "FAILED", "REFUNDED"] as const;
const STATUS_BADGE: Record<string, string> = {
  CREATED: "bg-slate-100 text-slate-600",
  PAID: "bg-brand-50 text-brand-700",
  FAILED: "bg-red-50 text-red-600",
  REFUNDED: "bg-amber-50 text-amber-700",
};

export default function AdminOrdersPage() {
  const [data, setData] = useState<OrdersData | null>(null);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<OrdersData>(`/payments/orders?limit=50${status ? `&status=${status}` : ""}`)
      .then(setData)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Could not load orders"));
  }, [status]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-slate-900">Orders</h1>
      <p className="mt-1 text-slate-600">Razorpay order ledger — paid, failed, refunded and in flight.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatus(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              status === s ? "bg-brand-600 text-white" : "border border-slate-300 text-slate-600 hover:border-brand-400"
            }`}
          >
            {s || "All statuses"}
          </button>
        ))}
      </div>

      {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!data && !error && <p className="mt-8 text-slate-500">Loading orders…</p>}

      {data && (
        <>
          <p className="mt-6 text-sm text-slate-500">{data.total} orders</p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Plan</th>
                  <th className="px-5 py-3">User</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((o) => (
                  <tr key={o.id}>
                    <td className="px-5 py-3 font-medium text-slate-900">{o.plan}</td>
                    <td className="px-5 py-3 text-slate-700">
                      {o.user.name}
                      <span className="block text-xs text-slate-400">{o.user.email}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-700">₹{(o.amountPaise / 100).toFixed(2)}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[o.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{new Date(o.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {data.items.length === 0 && <p className="p-8 text-center text-slate-400">No orders match this filter.</p>}
          </div>
        </>
      )}
    </div>
  );
}