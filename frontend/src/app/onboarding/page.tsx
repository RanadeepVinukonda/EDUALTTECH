"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getCachedUser, updateCachedUser, type User } from "@/lib/api";

const TOPICS = [
  "Programming",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "English",
  "Robotics",
  "Data Science",
  "Design",
  "Public Speaking",
  "Competitive Exams",
  "Career Guidance",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [topics, setTopics] = useState<string[]>([]);
  const [education, setEducation] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const cached = getCachedUser();
    if (!cached) {
      router.replace("/login");
      return;
    }
    if (!cached.phoneVerifiedAt) {
      router.replace("/verify-phone");
      return;
    }
    setUser(cached);
    setTopics(cached.interestedTopics ?? []);
    setEducation(cached.education ?? "");
    setBio(cached.bio ?? "");
  }, [router]);

  function toggle(topic: string) {
    setTopics((t) => (t.includes(topic) ? t.filter((x) => x !== topic) : [...t, topic]));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const data = await api<{ user: User }>("/auth/onboarding", {
        method: "POST",
        body: JSON.stringify({ interestedTopics: topics, education, ...(bio ? { bio } : {}) }),
      });
      updateCachedUser(data.user);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your details");
    } finally {
      setBusy(false);
    }
  }

  if (!user) return <div className="mx-auto max-w-2xl px-4 py-16 text-slate-500">Loading…</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Step 3 of 3</p>
      <h1 className="font-display mt-2 text-3xl font-bold text-slate-900">Tell us what you&apos;re into</h1>
      <p className="mt-2 text-slate-600">
        Pick the subjects you care about. This shapes your recommendations — you can teach one of them later too.
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={onSubmit} className="mt-8 space-y-6 rounded-3xl border border-slate-200 bg-white p-8">
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Subjects (pick at least one)</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {TOPICS.map((t) => {
              const active = topics.includes(t);
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => toggle(t)}
                  aria-pressed={active}
                  className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                    active
                      ? "border-brand-600 bg-brand-600 text-white"
                      : "border-slate-300 text-slate-600 hover:border-brand-400 hover:text-brand-700"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="education" className="mb-1 block text-sm font-medium text-slate-700">Current level</label>
          <input
            id="education"
            required
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder="e.g. Class 10, B.Sc 2nd year"
          />
        </div>

        <div>
          <label htmlFor="bio" className="mb-1 block text-sm font-medium text-slate-700">About you (optional)</label>
          <textarea
            id="bio"
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            placeholder="A line or two about your goals"
          />
        </div>

        <button
          type="submit"
          disabled={busy || topics.length === 0 || education.trim().length < 2}
          className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Finish setup"}
        </button>
      </form>
    </div>
  );
}