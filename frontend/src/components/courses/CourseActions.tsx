"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FavoriteBorder from "@mui/icons-material/FavoriteBorder";
import Favorite from "@mui/icons-material/Favorite";
import Button from "@/components/ui/Button";
import LinkButton from "@/components/ui/LinkButton";
import PayButton from "@/components/ui/PayButton";
import FlipClock from "@/components/ui/FlipClock";
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
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="font-display text-2xl font-semibold text-ink-900">{formatPrice(pricePaise, currency)}</p>
      <p className="mt-1 text-sm text-ink-600">{isPaid ? "One-time payment" : "No payment required"}</p>

      <div className="mt-5 space-y-3">
        {!ready ? (
          <Button className="w-full" disabled>
            Loading…
          </Button>
        ) : isLearner ? (
          <LinkButton href={`/dashboard/courses/${slug}`} className="w-full">
            Continue learning
          </LinkButton>
        ) : isMentor ? (
          <>
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink-700">
              You mentor this course.
            </p>
            <LinkButton href={`/dashboard/mentor/courses/${slug}`} variant="secondary" className="w-full">
              Open teaching workspace
            </LinkButton>
          </>
        ) : application && application.status !== "REJECTED" ? (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-medium text-ink-500">
              Mentor application
            </p>
            <p className="mt-1 text-sm font-semibold text-ink-900">
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
                {application.interviewAt && <FlipClock to={application.interviewAt} label="Starts in" />}
                {application.interviewUrl && (
                  <a
                    href={application.interviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
                  >
                    Join interview
                  </a>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-ink-600">
                Your application is under review. Enrolment opens here once it&apos;s cleared - we&apos;ll notify you.
              </p>
            )}
          </div>
        ) : !authed ? (
          <LinkButton href={loginHref} className="w-full">
            Sign in to enrol
          </LinkButton>
        ) : isPaid ? (
          <PayButton onClick={() => router.push(`/checkout?course=${encodeURIComponent(slug)}`)}>
            Pay now
          </PayButton>
        ) : (
          <PayButton loading={enrolling} onClick={() => void enrolFree()}>
            Enrol for free
          </PayButton>
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
            "inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-[15px] font-semibold text-ink-700 transition hover:bg-slate-50",
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
          Instant access upon enrolment · Lifetime curriculum updates
        </p>
      )}
    </div>
  );
}
