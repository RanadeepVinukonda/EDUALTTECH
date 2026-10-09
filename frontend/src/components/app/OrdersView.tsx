"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { Order, OrderStatus } from "@/lib/app-types";
import { formatDate, formatPrice } from "@/lib/format";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/Button";
import CoverImage from "@/components/ui/CoverImage";

const STATUS_LABEL: Record<OrderStatus, string> = {
  CREATED: "Payment pending",
  PAID: "Paid",
  FAILED: "Payment failed",
  REFUNDED: "Refunded",
};

const STATUS_TONE: Record<OrderStatus, string> = {
  CREATED: "text-amber-700",
  PAID: "text-emerald-700",
  FAILED: "text-red-700",
  REFUNDED: "text-slate-600",
};

export default function OrdersView() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { orders } = await apiGet<{ orders: Order[] }>("/payments/my-orders");
      setOrders(orders);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your orders.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!orders) return <Spinner label="Loading orders…" />;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Orders</h1>
        <p className="text-sm text-slate-500">Your purchases and their payment status.</p>
      </header>

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you enroll in a paid course, its order will appear here."
          action={
            <Link href="/courses" className={buttonClass("primary", "sm")}>
              Browse courses
            </Link>
          }
        />
      ) : (
        <ol className="flex flex-col divide-y divide-slate-200 rounded-[20px] border border-slate-200 bg-white">
          {orders.map((o) => {
            const isOpen = open === o.id;
            const payment = o.payments?.[0] ?? null;
            return (
              <li key={o.id} className="p-4 sm:p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    <CoverImage src={o.course.thumbnailUrl} alt="" fallback="" className="h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink-900">{o.course.title}</p>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Ref <span className="font-mono text-ink-700">{o.orderNumber}</span> · {formatDate(o.createdAt)}
                    </p>
                    <p className="mt-1 text-sm">
                      <span className={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</span>
                      <span className="text-slate-400"> · </span>
                      <span className="font-semibold text-ink-900">{formatPrice(o.amountPaise, o.currency)}</span>
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {o.status === "PAID" && (
                      <Link href={`/dashboard/courses/${o.course.slug}`} className={buttonClass("secondary", "sm")}>
                        Open course
                      </Link>
                    )}
                    <button
                      type="button"
                      className={buttonClass("ghost", "sm")}
                      aria-expanded={isOpen}
                      onClick={() => setOpen(isOpen ? null : o.id)}
                    >
                      {isOpen ? "Hide details" : "Details"}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <dl className="mt-4 grid gap-x-6 gap-y-2 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Order number</dt>
                      <dd className="font-mono text-ink-900">{o.orderNumber}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Status</dt>
                      <dd className={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Amount</dt>
                      <dd className="font-semibold text-ink-900">{formatPrice(o.amountPaise, o.currency)}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Placed</dt>
                      <dd className="text-ink-900">{formatDate(o.createdAt)}</dd>
                    </div>
                    {payment?.razorpayPaymentId && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Payment reference</dt>
                        <dd className="font-mono text-ink-900">{payment.razorpayPaymentId}</dd>
                      </div>
                    )}
                    {payment?.method && (
                      <div className="flex justify-between gap-4">
                        <dt className="text-slate-500">Method</dt>
                        <dd className="text-ink-900">{payment.method}</dd>
                      </div>
                    )}
                    <p className="text-slate-500 sm:col-span-2">
                      Receipts and invoices are not available yet.
                    </p>
                  </dl>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
