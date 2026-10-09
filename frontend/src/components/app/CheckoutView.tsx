"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import { loadRazorpay, createRazorpay } from "@/lib/razorpay";
import type { CheckoutPayload, CourseDetailResponse } from "@/lib/app-types";
import { formatPrice } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/notify";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import Button, { buttonClass } from "@/components/ui/Button";
import CoverImage from "@/components/ui/CoverImage";

function idempotencyKey(courseId: string): string {
  const storageKey = `checkout:key:${courseId}`;
  const existing = sessionStorage.getItem(storageKey);
  if (existing) return existing;
  const fresh = crypto.randomUUID();
  sessionStorage.setItem(storageKey, fresh);
  return fresh;
}

export default function CheckoutView({ slug }: { slug: string }) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [detail, setDetail] = useState<CourseDetailResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [needsMobile, setNeedsMobile] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [deepError, setDeepError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const d = await apiGet<CourseDetailResponse>(`/courses/${slug}`);
      setDetail(d);
      if (d.myParticipation) setEnrolled(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this course.");
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!authLoading && !user) router.replace(`/login?next=${encodeURIComponent(`/checkout?course=${slug}`)}`);
  }, [authLoading, user, router, slug]);

  function handleApiError(err: unknown) {
    if (err instanceof ApiError) {
      if (err.code === "MOBILE_VERIFICATION_REQUIRED") {
        setNeedsMobile(true);
        return;
      }
      if (err.code === "ALREADY_ENROLLED" || err.code === "ALREADY_PARTICIPANT") {
        setEnrolled(true);
        return;
      }
      setDeepError(err.message);
      return;
    }
    setDeepError(err instanceof Error ? err.message : "Something went wrong.");
  }

  async function payFree(courseId: string) {
    setBusy(true);
    setDeepError(null);
    try {
      await apiPost(`/courses/${courseId}/enroll`);
      notifySuccess("You're enrolled. Welcome aboard.");
      window.location.assign(`/dashboard/courses/${slug}/roadmap`);
    } catch (err) {
      handleApiError(err);
      setBusy(false);
    }
  }

  async function pay(courseId: string, courseTitle: string) {
    setBusy(true);
    setDeepError(null);
    try {
      const payload = await apiPost<CheckoutPayload>("/payments/orders", {
        courseId,
        idempotencyKey: idempotencyKey(courseId),
      });

      const ok = await loadRazorpay();
      if (!ok) throw new Error("Could not load the payment window. Check your connection and retry.");

      const rzp = createRazorpay({
        key: payload.keyId,
        amount: payload.amountPaise,
        currency: payload.currency,
        name: "EduAltTech",
        description: courseTitle,
        order_id: payload.razorpayOrderId,
        prefill: payload.prefill,
        handler: async (response) => {
          try {
            await apiPost("/payments/verify", response);
            sessionStorage.removeItem(`checkout:key:${courseId}`);
            window.location.assign(`/checkout/result?order=${encodeURIComponent(payload.razorpayOrderId)}`);
          } catch (err) {
            handleApiError(err);
            window.location.assign(`/checkout/result?order=${encodeURIComponent(payload.razorpayOrderId)}`);
          }
        },
        modal: {
          ondismiss: () => {
            notifyError("Payment cancelled. You can try again.");
            setBusy(false);
          },
        },
      });
      if (!rzp) throw new Error("Payment window unavailable.");
      rzp.open();
    } catch (err) {
      handleApiError(err);
      setBusy(false);
    }
  }

  if (authLoading) return <Spinner label="Loading checkout…" />;
  if (!user) return null;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!detail) return <Spinner label="Loading checkout…" />;

  const { course } = detail;
  const isPaid = course.pricePaise > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6">
      <Link href={`/courses/${course.slug}`} className="text-sm font-semibold text-brand-700 hover:underline">
        ← Back to course
      </Link>

      {enrolled ? (
        <section className="rounded-[20px] border border-slate-200 bg-white p-8 text-center shadow-elev1">
          <h1 className="font-display text-2xl font-bold text-ink-900">You&apos;re already enrolled</h1>
          <p className="mt-2 text-sm text-slate-500">Continue where you left off.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href={`/dashboard/courses/${course.slug}/roadmap`} className={buttonClass("primary", "sm")}>
              Open roadmap
            </Link>
            <Link href="/dashboard" className={buttonClass("secondary", "sm")}>
              Go to dashboard
            </Link>
          </div>
        </section>
      ) : course.status !== "PUBLISHED" ? (
        <section className="rounded-[20px] border border-slate-200 bg-white p-8 text-center shadow-elev1">
          <h1 className="font-display text-2xl font-bold text-ink-900">This course is not available</h1>
          <p className="mt-2 text-sm text-slate-500">It isn&apos;t open for enrollment right now.</p>
          <Link href="/courses" className={buttonClass("secondary", "sm", "mt-6")}>
            Browse courses
          </Link>
        </section>
      ) : (
        <>
          <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1">
            <h1 className="font-display text-2xl font-bold text-ink-900">Checkout</h1>
            <div className="mt-5 flex gap-4">
              <CoverImage src={course.thumbnailUrl} alt="" fallback={course.title} className="h-20 w-28 shrink-0 rounded-xl" />
              <div className="min-w-0">
                <h2 className="font-display font-bold text-ink-900">{course.title}</h2>
                <p className="mt-0.5 text-xs text-slate-500">{course.category}</p>
              </div>
            </div>

            <dl className="mt-6 space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-500">Price</dt>
                <dd className="font-semibold text-ink-900">{formatPrice(course.pricePaise, course.currency)}</dd>
              </div>
              <div className="flex justify-between text-base">
                <dt className="font-semibold text-ink-900">Total payable</dt>
                <dd className="font-display font-bold text-ink-900">{formatPrice(course.pricePaise, course.currency)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-slate-500">
              {isPaid
                ? "Payments are processed securely by Razorpay. Access is granted only after your payment is confirmed."
                : "This course is free — enroll to start learning."}
            </p>
          </section>

          {needsMobile && (
            <section role="alert" className="rounded-[20px] border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
              <p className="font-semibold">Verify your mobile number to continue.</p>
              <p className="mt-1">Paid courses require a verified mobile number.</p>
              <Link href="/dashboard/settings" className={buttonClass("primary", "sm", "mt-3")}>
                Verify mobile number
              </Link>
            </section>
          )}

          {deepError && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {deepError}
            </p>
          )}

          <div className="flex flex-col gap-3">
            {isPaid ? (
              <Button onClick={() => void pay(course.id, course.title)} loading={busy} disabled={needsMobile}>
                Pay {formatPrice(course.pricePaise, course.currency)}
              </Button>
            ) : (
              <Button onClick={() => void payFree(course.id)} loading={busy}>
                Enroll for free
              </Button>
            )}
            <Link href={`/courses/${course.slug}`} className={buttonClass("ghost", "sm")}>
              Cancel
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
