"use client";

import { useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { AdminOrderRow, Page } from "@/lib/app-types";
import { formatDate, formatMoney } from "@/lib/format";
import ErrorState from "@/components/ui/ErrorState";
import { AdminHeader, FilterSelect, Pagination, Panel, Skeleton, StatusPill, statusTone, useAsync, userName } from "./admin-ui";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "CREATED", label: "Created" },
  { value: "PAID", label: "Paid" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
];

export default function AdminOrders() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const orders = useAsync(
    () => apiGet<Page & { orders: AdminOrderRow[] }>("/payments/orders", { status: status || undefined, page, limit: 20 }),
    [status, page],
  );

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Orders & payments"
        description="Authoritative order records and the latest verified payment attempt for each. Amounts are stored as integer paise."
      />

      <Panel
        title="Orders"
        description="Server-filtered and paginated. Amounts come from the immutable order snapshot."
        actions={
          <FilterSelect
            id="order-status"
            label="Status"
            value={status}
            onChange={(v) => {
              setStatus(v);
              setPage(1);
            }}
            options={STATUS_OPTIONS}
          />
        }
      >
        {orders.error ? (
          <ErrorState message={orders.error} onRetry={orders.reload} />
        ) : orders.loading && !orders.data ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : orders.data && orders.data.orders.length > 0 ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-2 py-2 font-semibold">Order</th>
                    <th className="px-2 py-2 font-semibold">Purchaser</th>
                    <th className="px-2 py-2 font-semibold">Course</th>
                    <th className="px-2 py-2 font-semibold">Amount</th>
                    <th className="px-2 py-2 font-semibold">Status</th>
                    <th className="px-2 py-2 font-semibold">Created</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.data.orders.map((o) => (
                    <Row key={o.id} order={o} />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={orders.data.page}
              total={orders.data.total}
              limit={orders.data.limit}
              hasMore={orders.data.hasMore}
              onChange={setPage}
              busy={orders.loading}
            />
          </div>
        ) : (
          <p className="py-8 text-center text-sm text-slate-500">No orders match this filter.</p>
        )}
      </Panel>

      <p className="text-sm text-slate-500">
        Refunds and cancellations are not supported by the backend — there is no admin endpoint for them, so no such
        actions are offered here.
      </p>
    </div>
  );
}

function Row({ order: o }: { order: AdminOrderRow }) {
  const [open, setOpen] = useState(false);
  const p = o.payments[0];
  return (
    <>
      <tr className="align-top">
        <td className="px-2 py-3">
          <span className="font-mono text-xs text-ink-900">{o.orderNumber.slice(0, 12)}</span>
        </td>
        <td className="px-2 py-3">
          <p className="font-semibold text-ink-900">{userName(o.user)}</p>
          <p className="text-xs text-slate-500">{o.user.email}</p>
        </td>
        <td className="px-2 py-3">
          <Link href={`/dashboard/courses/${o.course.slug}`} className="font-medium text-brand-700 hover:underline">
            {o.course.title}
          </Link>
        </td>
        <td className="px-2 py-3 font-semibold text-ink-900">{formatMoney(o.amountPaise, o.currency)}</td>
        <td className="px-2 py-3">
          <StatusPill tone={statusTone(o.status)}>{o.status}</StatusPill>
        </td>
        <td className="px-2 py-3 text-slate-600">{formatDate(o.createdAt)}</td>
        <td className="px-2 py-3 text-right">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="rounded-lg px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
          >
            {open ? "Hide" : "Details"}
          </button>
        </td>
      </tr>
      {open && (
        <tr className="bg-slate-50">
          <td colSpan={7} className="px-4 py-4">
            <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Order id" mono value={o.id} />
              <Field label="Full order number" mono value={o.orderNumber} />
              <Field label="Provider order ref" mono value={o.razorpayOrderId} />
              {p ? (
                <>
                  <Field label="Payment id" mono value={p.razorpayPaymentId ?? "—"} />
                  <Field label="Method" value={p.method ?? "—"} />
                  <Field label="Payment verified" value={p.verified ? "Yes" : "No"} />
                  <Field label="Payment recorded" value={formatDate(p.createdAt)} />
                </>
              ) : (
                <Field label="Payment" value="No payment attempt recorded" />
              )}
              <Field label="Updated" value={formatDate(o.updatedAt)} />
              <Field label="Order status" value={o.status} />
            </dl>
          </td>
        </tr>
      )}
    </>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={mono ? "break-all font-mono text-xs text-ink-900" : "text-ink-900"}>{value}</dd>
    </div>
  );
}
