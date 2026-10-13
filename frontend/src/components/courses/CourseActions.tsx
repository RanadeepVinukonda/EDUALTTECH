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
import EnrollButton from "@/components/ui/EnrollButton";
import PayButton from "@/components/ui/PayButton";
import Countdown from "@/components/ui/Countdown";
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
  const loginHref = `/login?next=${encodeURIComponent(`/courses/${slug}`)}`;

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
          <LinkButton href={`/dashboard/courses/${slug}`} className="w-full">
            <CheckCircle fontSize="small" />
            Continue learning
          </LinkButton>
        ) : isMentor ? (
          <>
            <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-800">
              You mentor this course.
            </p>
            <LinkButton href={`/dashboard/mentor/courses/${slug}`} variant="secondary" className="w-full">
              Open teaching workspace
            </LinkButton>
          </>
        ) : application && application.status !== "REJECTED" ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-amber-700">
              Mentor application
            </p>
            <p className="mt-1.5 text-sm font-bold text-ink-900">
              {application.status === "INTERVIEW_SCHEDULED"
                ? "Interview scheduled"
                : application.status === "ACCEPTED"
                  ? "Accepted"
                  : APP_STATUS[application.status] ?? application.status}
            </p>

            {application.status === "INTERVIEW_SCHEDULED" ? (
              <div className="mt-2.5 space-y-2">
                {application.interviewAt && (
                  <p className="text-sm text-ink-600">
                    {new Date(application.interviewAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                )}
                {application.interviewAt && (
                  <Countdown
                    to={application.interviewAt}
                    className="inline-block rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-brand-700"
                  />
                )}
                {application.interviewUrl && (
                  <a
                    href={application.interviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
                  >
                    Join interview
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-600">
                Your application is under review. Enrolment opens here once it&apos;s cleared — we&apos;ll notify you.
              </p>
            )}
          </div>
        ) : !authed ? (
          <LinkButton href={loginHref} className="w-full">
            <Lock fontSize="small" />
            Sign in to enrol
          </LinkButton>
        ) : isPaid ? (
          <PayButton onClick={() => router.push(`/checkout?course=${encodeURIComponent(slug)}`)}>
            Pay now
          </PayButton>
        ) : (
          <EnrollButton onClick={() => void enrolFree()} loading={enrolling}>
            Enrol for free
          </EnrollButton>
        )}

        {ready && authed && !isLearner && !isMentor && (!application || application.status === "REJECTED") && (
          <LinkButton href={`/dashboard/mentor/apply?course=${encodeURIComponent(slug)}`} variant="secondary" className="w-full">
            {application?.status === "REJECTED" ? "Re-apply to mentor" : "Apply to mentor"}
          </LinkButton>
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
