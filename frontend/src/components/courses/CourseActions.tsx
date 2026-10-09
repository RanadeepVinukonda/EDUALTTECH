"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import Favorite from "@mui/icons-material/Favorite";
import Lock from "@mui/icons-material/Lock";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Button from "@/components/ui/Button";
import LinkButton from "@/components/ui/LinkButton";
import { api, ApiError } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { CourseDetailResponse } from "@/lib/types";

const APP_STATUS: Record<string, string> = {
  SUBMITTED: "under review",
  UNDER_REVIEW: "under review",
  INTERVIEW_SCHEDULED: "interview scheduled",
  ACCEPTED: "accepted",
  REJECTED: "not accepted",
};

export default function CourseActions({
  courseId,
  slug,
  pricePaise,
  currency,
}: {
  courseId: string;
  slug: string;
  pricePaise: number;
  currency: string;
}) {
  const router = useRouter();
  const loginHref = `/login?redirect=${encodeURIComponent(`/courses/${slug}`)}`;

  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [participation, setParticipation] = useState<CourseDetailResponse["myParticipation"]>(null);
  const [application, setApplication] = useState<CourseDetailResponse["myApplication"]>(null);
  const [wishlist, setWishlist] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [wishPending, setWishPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await getSupabase().auth.getSession();
      if (alive) setAuthed(Boolean(data.session));
      try {
        const d = await api<CourseDetailResponse>(`/courses/${slug}`, { method: "GET" });
        if (!alive) return;
        setParticipation(d.myParticipation);
        setApplication(d.myApplication);
        setWishlist(d.myWishlist);
      } catch {
        // Fall back to anonymous state; the public page still renders.
      } finally {
        if (alive) setReady(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [slug]);

  async function enrolFree() {
    setEnrolling(true);
    setError(null);
    try {
      await api(`/courses/${courseId}/enroll`, { method: "POST", body: {} });
      const d = await api<CourseDetailResponse>(`/courses/${slug}`, { method: "GET" });
      setParticipation(d.myParticipation);
      router.refresh();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Enrolment failed. Please try again.");
    } finally {
      setEnrolling(false);
    }
  }

  async function toggleWishlist() {
    if (!authed) {
      router.push(loginHref);
      return;
    }
    setWishPending(true);
    setError(null);
    try {
      if (wishlist) await api(`/wishlist/${courseId}`, { method: "DELETE" });
      else await api(`/wishlist/${courseId}`, { method: "POST" });
      setWishlist((w) => !w);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not update your wishlist.");
    } finally {
      setWishPending(false);
    }
  }

  const isLearner = participation?.role === "LEARNER";
  const isMentor = participation?.role === "MENTOR";
  const isPaid = pricePaise > 0;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-elev1">
      <p className="font-display text-3xl font-bold text-ink-900">{formatPrice(pricePaise, currency)}</p>
      <p className="mt-1 text-sm text-ink-600">{isPaid ? "One-time payment" : "No payment required"}</p>

      <div className="mt-5 space-y-3">
        {!ready ? (
          <Button className="w-full" disabled>
            Loading…
          </Button>
        ) : isLearner ? (
          <LinkButton href="/dashboard" className="w-full">
            <CheckCircle fontSize="small" />
            Continue learning
          </LinkButton>
        ) : isMentor ? (
          <>
            <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800">
              You mentor this course.
            </p>
            <LinkButton href="/dashboard" variant="secondary" className="w-full">
              Go to your dashboard
            </LinkButton>
          </>
        ) : !authed ? (
          <LinkButton href={loginHref} className="w-full">
            <Lock fontSize="small" />
            Sign in to enrol
          </LinkButton>
        ) : isPaid ? (
          <LinkButton href={`/checkout?course=${encodeURIComponent(slug)}`} className="w-full">
            Continue to checkout
          </LinkButton>
        ) : (
          <Button className="w-full" loading={enrolling} onClick={enrolFree}>
            Enrol for free
          </Button>
        )}

        <button
          type="button"
          onClick={toggleWishlist}
          disabled={wishPending || !ready}
          aria-pressed={wishlist}
          className={cn(
            "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-[15px] font-semibold text-ink-700 transition hover:bg-slate-50",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 disabled:opacity-50",
          )}
        >
          {wishlist ? <Favorite fontSize="small" className="text-brand-600" /> : <FavoriteBorder fontSize="small" />}
          {wishlist ? "In your wishlist" : "Add to wishlist"}
        </button>
      </div>

      {application && (
        <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-ink-600">
          Your mentor application is <span className="font-semibold text-ink-900">{APP_STATUS[application.status] ?? application.status}</span>.
          Mentoring is granted per course after review.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {!authed && ready && (
        <p className="mt-4 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href={loginHref} className="font-semibold text-brand-700 hover:text-brand-800">
            Sign in
          </Link>
        </p>
      )}
    </div>
  );
}
