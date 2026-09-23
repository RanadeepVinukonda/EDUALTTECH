"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api, ApiError, getCachedUser, updateCachedUser } from "@/lib/api";

const PLANS = [
  { plan: "TRIAL", label: "First-Class Trial", price: "₹1", note: "Try the platform for ₹1" },
  { plan: "FULL", label: "Full Plan", price: "₹499", note: "Unlimited access, forever yours" },
] as const;

interface Chapter {
  id: string;
  title: string;
  summary: string | null;
  order: number;
  meetingUrl: string | null;
  recordingUrl: string | null;
  resources: Array<{ label: string; url: string }>;
}

interface Mentor {
  id: string;
  mentor: { id: string; name: string; avatarUrl: string | null; bio: string | null; education: string | null };
  chapters: Chapter[];
  _count: { enrollments: number };
}

interface CourseDetail {
  id: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string | null;
  thumbnailUrl: string | null;
  teacher: { name: string };
  mentors: Mentor[];
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
  const [busy, setBusy] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    api<{ course: CourseDetail }>(`/courses/${params.slug}`)
      .then((d) => {
        setCourse(d.course);
        if (d.course.mentors.length === 1) setSelected(d.course.mentors[0].id);
      })
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load course"));
  }, [params.slug]);

  async function enroll() {
    if (!course) return;
    if (!getCachedUser()) {
      router.push("/login");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api(`/courses/${course.id}/enroll`, {
        method: "POST",
        body: JSON.stringify(selected ? { courseMentorId: selected } : {}),
      });
      setEnrolled(true);
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
          name: "Edu-Alt-Tech",
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment could not be completed");
      setPaying(false);
      return;
    }
    await api(`/courses/${course.id}/enroll`, { method: "POST", body: JSON.stringify(selected ? { courseMentorId: selected } : {}) });
    const me = await api<{ user: import("@/lib/api").User }>("/auth/me").catch(() => null);
    if (me) updateCachedUser(me.user);
    setShowPay(false);
    setPaying(false);
    setEnrolled(true);
  }

  if (error && !course) return <div className="mx-auto max-w-5xl px-4 py-16 text-red-600">{error}</div>;
  if (!course) return <div className="mx-auto max-w-5xl px-4 py-16 text-slate-500">Loading course…</div>;

  const activeMentor = course.mentors.find((m) => m.id === selected) ?? course.mentors[0] ?? null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
        {course.subject}{course.gradeLevel ? ` · ${course.gradeLevel}` : ""}
      </p>
      <h1 className="font-display mt-2 text-4xl font-bold text-slate-900">{course.title}</h1>
      <p className="mt-1 text-sm text-slate-500">Hosted by {course.teacher.name} · {course._count.enrollments} enrolled</p>
      <p className="mt-4 max-w-3xl text-lg text-slate-600">{course.description}</p>

      {course.mentors.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-xl font-semibold text-slate-900">Choose your mentor</h2>
          <p className="mt-1 text-sm text-slate-500">Each mentor runs the course their own way, with their own chapters.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {course.mentors.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelected(m.id)}
                aria-pressed={selected === m.id}
                className={`rounded-2xl border p-5 text-left transition ${
                  selected === m.id ? "border-brand-600 bg-brand-50" : "border-slate-200 bg-white hover:border-brand-300"
                }`}
              >
                <p className="font-semibold text-slate-900">{m.mentor.name}</p>
                {m.mentor.education && <p className="mt-0.5 text-xs text-slate-500">{m.mentor.education}</p>}
                {m.mentor.bio && <p className="mt-2 text-sm text-slate-600">{m.mentor.bio}</p>}
                <p className="mt-3 text-xs font-medium text-brand-700">
                  {m._count.enrollments} learners · {m.chapters.length} chapters
                </p>
              </button>
            ))}
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
      ) : (
        <button
          onClick={enroll}
          disabled={busy || enrolled || (course.mentors.length > 0 && !selected)}
          className="mt-6 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {enrolled ? "Enrolled" : busy ? "Enrolling…" : course.mentors.length > 0 && !selected ? "Pick a mentor first" : "Enroll in this course"}
        </button>
      )}

      {activeMentor && activeMentor.chapters.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-slate-900">
            {activeMentor.mentor.name}&apos;s roadmap
          </h2>
          <ol className="mt-4 space-y-4">
            {activeMentor.chapters.map((c) => (
              <li key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Chapter {c.order}</p>
                <h3 className="font-display text-lg font-semibold text-slate-900">{c.title}</h3>
                {c.summary && <p className="mt-1 text-sm text-slate-600">{c.summary}</p>}
                <div className="mt-3 flex flex-wrap gap-4 text-sm">
                  {c.meetingUrl && <Link href={c.meetingUrl} className="font-medium text-brand-700 hover:text-brand-800">Join live session</Link>}
                  {c.recordingUrl && <Link href={c.recordingUrl} className="font-medium text-brand-700 hover:text-brand-800">Watch recording</Link>}
                  {c.resources.map((r) => (
                    <Link key={r.url} href={r.url} className="font-medium text-brand-700 hover:text-brand-800">
                      {r.label}
                    </Link>
                  ))}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      <div className="mt-10 space-y-6">
        {course.modules.map((mod) => (
          <section key={mod.id} className="rounded-2xl border border-slate-200 bg-white">
            <header className="border-b border-slate-100 px-6 py-4">
              <p className="text-xs uppercase tracking-wide text-slate-400">Module {mod.position}</p>
              <h2 className="font-display text-lg font-semibold text-slate-900">{mod.title}</h2>
            </header>
            <ul className="divide-y divide-slate-50">
              {mod.lessons.map((l) => (
                <li key={l.id} className="flex items-center gap-3 px-6 py-3 text-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {l.position}
                  </span>
                  <span className="text-slate-700">{l.title}</span>
                  <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">{l.type}</span>
                </li>
              ))}
              {mod.lessons.length === 0 && <li className="px-6 py-3 text-sm text-slate-400">Lessons coming soon</li>}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}