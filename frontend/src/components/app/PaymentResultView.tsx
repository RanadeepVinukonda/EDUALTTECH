"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import type { Order } from "@/lib/app-types";
import { formatDate, formatPrice } from "@/lib/format";
import Spinner from "@/components/ui/Spinner";
import Button, { buttonClass } from "@/components/ui/Button";

const MAX_POLLS = 6;
const POLL_MS = 5000;

type Phase = "confirmed" | "pending" | "failed" | "refunded" | "cancelled" | "unknown";

function phaseOf(order: Order | null, cancelled: boolean): Phase {
  if (!order) return cancelled ? "cancelled" : "unknown";
  switch (order.status) {
    case "PAID":
      return "confirmed";
    case "CREATED":
      return "pending";
    case "FAILED":
      return "failed";
    case "REFUNDED":
      return "refunded";
    default:
      return "unknown";
  }
}

export default function PaymentResultView({ orderRef, cancelled }: { orderRef: string | null; cancelled: boolean }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [order, setOrder] = useState<Order | null | undefined>(undefined); // undefined = not loaded
  const [error, setError] = useState<string | null>(null);
  const polls = useRef(0);

  const load = useCallback(async () => {
    if (!orderRef) {
      setOrder(null);
      return;
    }
    try {
      const { orders } = await apiGet<{ orders: Order[] }>("/payments/my-orders");
      setOrder(orders.find((o) => o.razorpayOrderId === orderRef) ?? null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not check your payment status.");
      setOrder(null);
    }
  }, [orderRef]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?next=${encodeURIComponent(`/checkout/result${orderRef ? `?order=${orderRef}` : ""}`)}`);
  }, [authLoading, user, router, orderRef]);

  // Bounded polling while the order is still being processed server-side.
  useEffect(() => {
    if (order?.status !== "CREATED" || polls.current >= MAX_POLLS) return;
    const t = setTimeout(() => {
      polls.current += 1;
      void load();
    }, POLL_MS);
    return () => clearTimeout(t);
  }, [order, load]);

  if (authLoading) return <Spinner label="Checking payment status…" />;
  if (!user) return null;
  if (order === undefined) return <Spinner label="Checking payment status…" />;

  const phase = phaseOf(order, cancelled);
  const courseSlug = order?.course.slug;

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-10 sm:px-6">
      <div className="rounded-[20px] border border-slate-200 bg-white p-8 text-center shadow-elev1">
        <StatusHeading phase={phase} />

        {phase === "confirmed" && order && (
          <div className="mt-6 space-y-4 text-left">
            <dl className="space-y-2 text-sm">
              <Row label="Course" value={order.course.title} />
              <Row label="Order number" value={order.orderNumber} />
              <Row label="Amount paid" value={formatPrice(order.amountPaise, order.currency)} />
              <Row label="Date" value={formatDate(order.createdAt, { dateStyle: "medium" })} />
              {order.payments?.[0]?.razorpayPaymentId && <Row label="Payment id" value={order.payments[0].razorpayPaymentId} />}
            </dl>
          </div>
        )}

        {error && phase !== "confirmed" && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-col items-center gap-3">
          {phase === "confirmed" && courseSlug && (
            <Link href={`/dashboard/courses/${courseSlug}/roadmap`} className={buttonClass("primary", "md")}>
              Start learning
            </Link>
          )}
          {(phase === "pending" || phase === "unknown") && (
            <Button
              onClick={() => {
                polls.current = 0;
                void load();
              }}
            >
              Check again
            </Button>
          )}
          {(phase === "failed" || phase === "cancelled") && courseSlug && (
            <Link href={`/checkout?course=${encodeURIComponent(courseSlug)}`} className={buttonClass("primary", "md")}>
              Try payment again
            </Link>
          )}
          <Link href="/dashboard" className={buttonClass("secondary", "sm")}>
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatusHeading({ phase }: { phase: Phase }) {
  const map: Record<Phase, { title: string; note: string; tone: string }> = {
    confirmed: { title: "Payment confirmed", note: "You're enrolled. Your access is ready.", tone: "text-green-700" },
    pending: { title: "Payment processing", note: "We're waiting for the payment to be confirmed. This can take a moment.", tone: "text-ink-900" },
    failed: { title: "Payment failed", note: "The payment didn't go through. You can try again.", tone: "text-red-700" },
    refunded: { title: "Payment refunded", note: "This order was refunded.", tone: "text-ink-900" },
    cancelled: { title: "Checkout cancelled", note: "You left before completing payment.", tone: "text-ink-900" },
    unknown: { title: "Payment status unavailable", note: "We couldn't confirm this order. If you were charged, it will be reconciled shortly.", tone: "text-ink-900" },
  };
  const s = map[phase];
  return (
    <>
      <h1 className={`font-display text-2xl font-bold ${s.tone}`}>{s.title}</h1>
      <p className="mt-2 text-sm text-slate-500">{s.note}</p>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-ink-900">{value}</dd>
    </div>
  );
}
