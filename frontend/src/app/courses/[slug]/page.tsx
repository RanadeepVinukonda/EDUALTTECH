"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Bookmark as BookmarkIcon } from "lucide-react";
import { api, ApiError, getCachedUser, updateCachedUser } from "@/lib/api";
import { CourseChat } from "@/components/courses/CourseChat";
import CourseRoadmap, { type RoadmapChapter, type RoadmapMeeting, type RoadmapProgress, type RoadmapShell } from "@/components/courses/CourseRoadmap";

type RoadmapPayload = {
  roadmap: RoadmapShell & { chapters: RoadmapChapter[] };
  meetings: RoadmapMeeting[];
  progress: RoadmapProgress;
};
import { MentorCoursePanel } from "@/components/courses/MentorCoursePanel";

const PLANS = [
  { plan: "TRIAL", label: "First-Class Trial", price: "₹1", note: "Try the platform for ₹1" },
  { plan: "FULL", label: "Full Plan", price: "₹499", note: "Unlimited access, forever yours" },
] as const;

/** Title-only chapter from the public course payload; the unlocked roadmap
 *  endpoint returns the same shape plus lesson content. */
type Chapter = RoadmapChapter & { _count?: { modules: number } };

interface CourseMeeting {
  id: string;
  title: string;
  scheduledAt: string;
  durationMin: number;
  meetingUrl: string;
  chapter: { id: string; title: string } | null;
}

interface Insights {
  topResources: Array<{ id: string; title: string; kind: string; fileUrl: string; downloads: number }>;
  topLessons: Array<{
    id: string;
    title: string;
    type: string;
    position: number;
    module: { id: string; title: string } | null;
    _count: { progressItems: number };
  }>;
}

interface CourseResource {
  id: string;
  title: string;
  subject: string;
  kind: string;
  fileUrl: string;
  fileSizeBytes: number | null;
  createdAt: string;
}

interface Mentor {
  id: string;
  capacity: number;
  seatsLeft: number;
  mentor: { id: string; name: string; avatarUrl: string | null; bio: string | null; education: string | null };
  chapters: Chapter[];
  _count: { enrollments: number };
}

interface MentorApplication {
  id: string;
  status: "PENDING" | "UNDER_REVIEW" | "INTERVIEW" | "APPROVED" | "REJECTED";
  courseId: string;
  reviewNote: string | null;
  meetingLink: string | null;
}

interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string | null;
  thumbnailUrl: string | null;
  teacher: { id: string; name: string };
  mentors: Mentor[];
  chapters: Chapter[];
  roadmapTitle: string | null;
  roadmapSummary: string | null;
  resources: CourseResource[];
  modules: Array<{
    id: string;
    title: string;
    position: number;
    lessons: Array<{ id: string; title: string; type: string; position: number }>;
  }>;
  _count: { enrollments: number };
}

export default function CourseDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [paying, setPaying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [meetings, setMeetings] = useState<CourseMeeting[] | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [mentorView, setMentorView] = useState<{ courseMentorId: string } | null>(null);
  const [mentorApp, setMentorApp] = useState<MentorApplication | null>(null);
  // Unlocked roadmap (with recording/meeting links) — teaser data from the
  // course payload stays title-only until the viewer is in the course.
  const [roadmap, setRoadmap] = useState<RoadmapPayload | null>(null);

  useEffect(() => {
    api<{ course: CourseDetail }>(`/courses/${params.slug}`)
      .then((d) => {
        setCourse(d.course);
        if (d.course.mentors.length === 1) setSelected(d.course.mentors[0].id);
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load course"));
  }, [params.slug]);

  const loadRoadmap = useCallback(() => {
    if (!course) return;
    void api<RoadmapPayload>(`/courses/${course.id}/roadmap`).then(setRoadmap).catch(() => undefined);
  }, [course]);

  // Backfill status for returning visitors: enrolled, wishlist, upcoming meetings.
  // All three are server-authoritative and quietly skipped when signed out.
  useEffect(() => {
    if (!course) return;
    if (!getCachedUser()) return;
    (async () => {
      try {
        const mine = await api<{ seeking: Array<{ id: string; course: { id: string }; courseMentor: { id: string } | null }>; mentoring: Array<{ id: string; course: { id: string } }> }>("/courses/mine").catch(() => null);
        const seeking = mine?.seeking.find((e) => e.course.id === course.id);
        if (seeking) {
          setEnrolled(true);
          setEnrollmentId(seeking.id);
        }
        const mentoring = mine?.mentoring.find((m) => m.course.id === course.id);
        if (mentoring) setMentorView({ courseMentorId: mentoring.id });
        // An open mentor application locks both actions: no second application,
        // and no enrolling in a course you may end up teaching.
        const app = await api<{ application: MentorApplication | null }>("/teachers/me").catch(() => null);
        if (app?.application && app.application.courseId === course.id
          && ["PENDING", "UNDER_REVIEW", "INTERVIEW", "APPROVED"].includes(app.application.status)) {
          setMentorApp(app.application);
        }
        const rm = await api<RoadmapPayload>(`/courses/${course.id}/roadmap`).catch(() => null);
        if (rm) setRoadmap(rm);
        const wish = await api<{ items: Array<{ id: string }> }>("/wishlist").catch(() => null);
        if (wish?.items.some((i) => i.id === course.id)) setSaved(true);
        const meets = await api<{ meetings: CourseMeeting[] }>(`/meetings/course/${course.id}`).catch(() => null);
        if (meets) setMeetings(meets.meetings);
        const useTopped = await api<{ topResources: Insights["topResources"]; topLessons: Insights["topLessons"] }>(`/courses/${course.id}/insights`).catch(() => null);
        if (useTopped) setInsights(useTopped);
      } catch {
        // 401/403 — treat as "no access", leave defaults.
      }
    })();
  }, [course]);

  async function toggleWishlist() {
    if (!course) return;
    if (!getCachedUser()) {
      router.push("/login");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (saved) {
        await api(`/wishlist/${course.id}`, { method: "DELETE" });
        setSaved(false);
      } else {
        await api(`/wishlist/${course.id}`, { method: "POST" });
        setSaved(true);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update wishlist");
    } finally {
      setSaving(false);
    }
  }

  async function enroll() {
    if (!course) return;
    if (!getCachedUser()) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const d = await api<{ enrollment: { id: string } }>(`/courses/${course.id}/enroll`, {
        method: "POST",
        body: JSON.stringify(selected ? { courseMentorId: selected } : {}),
      });
      setEnrolled(true);
      if (d.enrollment) setEnrollmentId(d.enrollment.id);
    } catch (err) {
      const e = err instanceof ApiError ? err : null;
      if (e?.status === 402) {
        setShowPay(true);
      } else {
        setError(e?.message ?? "Enrollment failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function loadRazorpay(): Promise<void> {
    return new Promise((resolve, reject) => {
      if ((window as unknown as { Razorpay?: unknown }).Razorpay) return resolve();
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Could not load the payment gateway"));
      document.body.appendChild(s);
    });
  }

  async function pay(plan: (typeof PLANS)[number]["plan"]) {
    if (!course) return;
    setPaying(true);
    setError(null);
    try {
      const { order, razorpayKeyId } = await api<{ order: { razorpayOrderId: string; amountPaise: number }; razorpayKeyId: string }>(
        "/payments/orders",
        {
          method: "POST",
          body: JSON.stringify({ plan, idempotencyKey: `enroll-${course.id}-${crypto.randomUUID()}` }),
        },
      );
      await loadRazorpay();

      const handlerResp = await new Promise<{ razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }>((resolve, reject) => {
        const win = window as unknown as {
          Razorpay: new (opts: {
            key: string;
            amount: number;
            currency: string;
            name: string;
            order_id: string;
            handler: (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
            modal?: { ondismiss?: () => void };
          }) => { on: (ev: string, fn: () => void) => void; open: () => void };
        };
        const rp = new win.Razorpay({
          key: razorpayKeyId,
          amount: order.amountPaise,
          currency: "INR",
          name: "EduAltTech",
          order_id: order.razorpayOrderId,
          handler: (r) => resolve(r),
          modal: { ondismiss: () => reject(new Error("Payment cancelled")) },
        });
        rp.on("payment.failed", () => reject(new Error("Payment failed — try again")));
        rp.open();
      });

      await api("/payments/verify", {
        method: "POST",
        body: JSON.stringify({
          razorpay_order_id: handlerResp.razorpay_order_id,
          razorpay_payment_id: handlerResp.razorpay_payment_id,
          razorpay_signature: handlerResp.razorpay_signature,
        }),
      });

      try {
        const d = await api<{ enrollment?: { id: string } }>(`/courses/${course.id}/enroll`, {
          method: "POST",
          body: JSON.stringify(selected ? { courseMentorId: selected } : {}),
        });
        if (d.enrollment) setEnrollmentId(d.enrollment.id);
        const me = await api<{ user: import("@/lib/api").User }>("/auth/me").catch(() => null);
        if (me) updateCachedUser(me.user);
        setShowPay(false);
        setEnrolled(true);
      } catch {
        setError("Payment received — click Enroll to finish and start learning.");
        setShowPay(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be completed");
    } finally {
      setPaying(false);
    }
  }

  if (error && !course) return <div className="mx-auto max-w-5xl px-4 py-16 text-red-600">{error}</div>;
  if (!course) return <div className="mx-auto max-w-5xl px-4 py-16 text-slate-500">Loading course…</div>;

  const activeMentor = course.mentors.find((m) => m.id === selected) ?? course.mentors[0] ?? null;
  const user = getCachedUser();
  // Owner/mentor/admin and ACTIVE enrollees see the real course; everyone else
  // gets the locked roadmap shell until they pay.
  const isStaff = !!user && (course.teacher.id === user.id
    || course.mentors.some((m) => m.mentor.id === user.id)
    || user.role === "ADMIN");
  const unlocked = !!mentorView || enrolled || isStaff;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      {course.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={course.thumbnailUrl}
          alt=""
          className="mb-6 h-56 w-full rounded-2xl object-cover"
        />
      )}
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
        {course.subject}{course.gradeLevel ? ` · ${course.gradeLevel}` : ""}
      </p>
      <h1 className="font-display mt-2 text-4xl font-bold text-slate-900">{course.title}</h1>
      <p className="mt-1 text-sm text-slate-500">Hosted by {course.teacher.name} · {course._count.enrollments} enrolled</p>
      <p className="mt-4 max-w-3xl text-lg text-slate-600">{course.description}</p>

      {mentorApp && mentorApp.status !== "APPROVED" && <MentorStatusBanner app={mentorApp} />}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {isStaff ? (
          <span className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600">
            You teach this course — learners can enroll and pick you as their mentor.
          </span>
        ) : showPay ? null : (
          <>
            <button
              onClick={enroll}
              disabled={busy || enrolled || !!mentorApp || (course.mentors.length > 0 && !selected)}
              className="rounded-xl brand-grad px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {enrolled
                ? "Enrolled"
                : mentorApp
                  ? "Enrollment closed while your mentor request is open"
                  : busy
                    ? "Enrolling…"
                    : course.mentors.length > 0 && !selected
                      ? "Pick a mentor first"
                      : "Enroll in this course"}
            </button>
            <button
              onClick={toggleWishlist}
              disabled={saving}
              aria-pressed={saved}
              aria-label={saved ? "Remove from bookmarks" : "Bookmark this course"}
              className={`flex items-center gap-1.5 rounded-xl border px-4 py-3 text-sm font-semibold transition disabled:opacity-60 ${
                saved ? "border-brand-600 bg-brand-50 text-brand-700" : "border-slate-300 bg-white text-slate-600 hover:border-brand-400 hover:text-brand-700"
              }`}
            >
              <BookmarkIcon className={`h-4 w-4 ${saved ? "fill-brand-600" : ""}`} />
              {saved ? "Bookmarked" : "Bookmark"}
            </button>
            {mentorApp ? (
              <span className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                Mentor request {mentorApp.status === "APPROVED" ? "approved" : "pending"}
              </span>
            ) : (
              <Link
                href={`/teachers/apply?course=${course.slug}`}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:border-brand-400 hover:text-brand-700"
              >
                Mentor this course
              </Link>
            )}
          </>
        )}
      </div>

      {course.mentors.length > 0 && !mentorView && !isStaff && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-slate-900">Choose your mentor</h2>
          <p className="mt-1 text-sm text-slate-500">Each mentor runs the course their own way. Full mentors are closed — pick one with open seats.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {course.mentors.map((m) => {
              const full = m.seatsLeft <= 0;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelected(m.id)}
                  disabled={full}
                  aria-pressed={selected === m.id}
                  className={`rounded-2xl border p-5 text-left transition ${
                    selected === m.id ? "border-brand-600 bg-brand-50" : "border-slate-200 bg-white hover:border-brand-300"
                  } ${full ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-900">{m.mentor.name}</p>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${full ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-700"}`}>
                      {full ? "Full" : `${m.seatsLeft} seats left`}
                    </span>
                  </div>
                  {m.mentor.education && <p className="mt-0.5 text-xs text-slate-500">{m.mentor.education}</p>}
                  {m.mentor.bio && <p className="mt-2 text-sm text-slate-600">{m.mentor.bio}</p>}
                  <p className="mt-3 text-xs font-medium text-brand-700">
                    {m._count.enrollments} learners
                  </p>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {showPay ? (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-display text-lg font-semibold text-slate-900">Pick a plan to enroll</h2>
          <p className="mt-1 text-sm text-slate-600">Payments are secured by Razorpay. Test mode: card <code className="rounded bg-slate-100 px-1">4111 1111 1111 1111</code>, any future date &amp; CVV.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {PLANS.map((p) => (
              <button
                key={p.plan}
                type="button"
                disabled={paying}
                onClick={() => pay(p.plan)}
                className="rounded-2xl border border-brand-200 bg-brand-50 p-4 text-left transition hover:border-brand-500 disabled:opacity-50"
              >
                <p className="font-semibold text-brand-900">{p.label}</p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{p.price}</p>
                <p className="mt-1 text-sm text-slate-500">{p.note}</p>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => {
              setShowPay(false);
              setError(null);
            }}
            disabled={paying}
            className="mt-3 text-sm font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      ) : enrolled ? (
        <p className="mt-6 text-sm text-slate-500">You are enrolled in this course.</p>
      ) : null}

      {meetings && meetings.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-slate-900">Upcoming live classes</h2>
          <ul className="mt-4 space-y-3">
            {meetings.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5">
                <div>
                  <p className="font-semibold text-slate-900">{m.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {new Date(m.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {m.durationMin} min
                  </p>
                </div>
                <a href={m.meetingUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                  Join
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {mentorView && (
        <div className="mt-12 border-t border-slate-200 pt-10">
          <MentorCoursePanel
            courseId={course.id}
            courseSlug={course.slug}
            courseMentorId={mentorView.courseMentorId}
            courseTitle={course.title}
          />
        </div>
      )}

      {/* Knowledge unlocked only after enrolling/mentoring. Anonymous and
          unenrolled visitors see the roadmap shell — chapter titles, no
          videos, no concepts, no resources. */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-slate-900">Course roadmap</h2>
            {!unlocked && course.chapters.length > 0 && (
              <p className="text-xs font-medium text-slate-400">
                {course.chapters.length} chapter{course.chapters.length === 1 ? "" : "s"} · enroll to unlock the concepts
              </p>
            )}
          </div>

          {unlocked || roadmap ? (
            <CourseRoadmap
              courseId={course.id}
              chapters={roadmap?.roadmap.chapters ?? course.chapters ?? []}
              roadmap={roadmap?.roadmap ?? { title: course.roadmapTitle, summary: course.roadmapSummary, meetingUrl: null, recordingUrl: null, resources: [] }}
              meetings={roadmap?.meetings ?? meetings ?? []}
              initialProgress={roadmap?.progress}
              onChanged={loadRoadmap}
              mode="learn"
              locked={!unlocked}
            />
          ) : (
            <p className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-400">No roadmap yet for this course.</p>
          )}
        </section>

        {/* Enrolled right rail — live chat + what the class is actually using */}
        {unlocked && (
          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-display text-lg font-semibold text-slate-900">Class chat</h3>
              <p className="mt-1 mb-3 text-xs text-slate-500">
                One thread for everyone in this course — mentor messages reach every enrolled student.
              </p>
              <CourseChat courseId={course.id} />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-display text-lg font-semibold text-slate-900">Most viewed resources</h3>
              {insights && insights.topResources.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {insights.topResources.map((r) => (
                    <li key={r.id}>
                      <a
                        href={r.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm hover:bg-brand-50"
                      >
                        <span className="min-w-0 truncate text-slate-700">{r.title}</span>
                        <span className="shrink-0 text-xs text-slate-400">{r.downloads} opens</span>
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-400">Nothing opened yet.</p>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-display text-lg font-semibold text-slate-900">Most watched</h3>
              {insights && insights.topLessons.length > 0 ? (
                <ul className="mt-3 space-y-2">
                  {insights.topLessons.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                      <span className="min-w-0">
                        <span className="block truncate text-slate-700">{l.title}</span>
                        {l.module && <span className="block text-xs text-slate-400">{l.module.title}</span>}
                      </span>
                      <span className="shrink-0 text-xs text-slate-400">{l._count.progressItems} completions</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-400">Students haven&apos;t finished lessons yet.</p>
              )}
            </section>
          </aside>
        )}
      </div>
    </div>
  );
}

/** Where the user's own mentor application for this course stands. */
const MENTOR_APP_UI: Record<MentorApplication["status"], { tone: string; dot: string; label: string; body: string }> = {
  PENDING: { tone: "border-amber-300 bg-amber-50", dot: "bg-amber-500", label: "Pending — admin reviewing", body: "Your mentor application is in the queue. An admin reviews every application by hand; you will get an email with the outcome." },
  UNDER_REVIEW: { tone: "border-amber-300 bg-amber-50", dot: "bg-amber-500", label: "Under review", body: "An admin is reviewing your mentor application right now." },
  INTERVIEW: { tone: "border-sky-300 bg-sky-50", dot: "bg-sky-500", label: "Interview scheduled", body: "You are through review and have an interview booked. Join using the link below." },
  APPROVED: { tone: "border-emerald-300 bg-emerald-50", dot: "bg-emerald-600", label: "Approved mentor", body: "You are mentoring this course. Add lessons inside each chapter, plus live classes, recordings and resources, from the mentor panel below." },
  REJECTED: { tone: "border-slate-200 bg-slate-50", dot: "bg-slate-400", label: "Not approved", body: "This application was not approved." },
};

function MentorStatusBanner({ app }: { app: MentorApplication }) {
  const ui = MENTOR_APP_UI[app.status];
  return (
    <div className={`mt-5 rounded-2xl border px-5 py-4 ${ui.tone}`} role="status">
      <p className="flex items-center gap-2 text-sm font-bold text-slate-900">
        <span className={`h-2 w-2 shrink-0 rounded-full ${ui.dot} ${app.status === "PENDING" || app.status === "UNDER_REVIEW" ? "animate-pulse" : ""}`} />
        Mentor application · {ui.label}
      </p>
      <p className="mt-1 text-sm text-slate-600">{ui.body}</p>
      {app.status === "INTERVIEW" && app.meetingLink && (
        <a
          href={app.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-block rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Join interview
        </a>
      )}
      {app.reviewNote && (
        <p className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs text-slate-600">Admin note: {app.reviewNote}</p>
      )}
    </div>
  );
}

function MeetingCountdown({ scheduledAt }: { scheduledAt: string }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = new Date(scheduledAt).getTime() - now;
  if (diff <= 0) {
    return <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">Live now</span>;
  }
  const days = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);
  const label = days > 0 ? `${days}d ${hours}h ${mins}m` : `${hours}h ${mins}m ${secs}s`;
  return <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">Starts in {label}</span>;
}