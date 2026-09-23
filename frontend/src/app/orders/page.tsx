"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

interface Order {
  id: string;
  orderNumber: string;
  plan: "TRIAL" | "FULL";
  amountPaise: number;
  status: "CREATED" | "PAID" | "FAILED" | "REFUNDED";
  createdAt: string;
}

const STATUS_BADGE: Record<string, string> = {
  CREATED: "bg-slate-100 text-slate-600",
  PAID: "bg-brand-50 text-brand-700",
  FAILED: "bg-red-50 text-red-600",
  REFUNDED: "bg-amber-50 text-amber-700",
};

const PLAN_LABEL: Record<string, string> = { TRIAL: "First-Class Trial", FULL: "Full Plan" };

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ orders: Order[] }>("/payments/my-orders")
      .then((d) => setOrders(d.orders))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Could not load your orders"));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-slate-900">My orders</h1>
      <p className="mt-1 text-slate-600">Your plan purchases and their payment status.</p>

      {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {!error && orders.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 p-10 text-center">
          <p className="text-slate-500">No orders yet.</p>
          <Link href="/courses" className="mt-2 inline-block font-semibold text-brand-700 hover:text-brand-800">
            Explore courses →
          </Link>
        </div>
      )}

      <ul className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
        {orders.map((o) => (
          <li key={o.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
            <div>
              <p className="font-medium text-slate-900">{PLAN_LABEL[o.plan]}</p>
              <p className="text-xs text-slate-500">
                {new Date(o.createdAt).toLocaleDateString()} · ref {o.orderNumber.slice(0, 10)}…
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-800">₹{(o.amountPaise / 100).toFixed(2)}</span>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_BADGE[o.status] ?? "bg-slate-100 text-slate-600"}`}>
                {o.status}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-sm text-slate-500">
        Problems with a payment?{" "}
        <Link href="/contact" className="font-semibold text-brand-700 hover:text-brand-800">
          Contact us
        </Link>
        .
      </p>
    </div>
  );
}