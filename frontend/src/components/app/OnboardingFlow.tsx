"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPatch } from "@/lib/api";
import { useAuth } from "@/components/app/AuthProvider";
import { notifyError, notifySuccess } from "@/lib/notify";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import type { Me } from "@/lib/app-types";

const EDUCATION = ["School", "Undergraduate", "Postgraduate", "Professional", "Other"];

export default function OnboardingFlow() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [educationLevel, setEducationLevel] = useState("");
  const [institution, setInstitution] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [gradYear, setGradYear] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=%2Fonboarding");
      return;
    }
    if (user.onboardingDone) router.replace("/dashboard");
  }, [loading, user, router]);

  async function submit(done: boolean) {
    setSaving(true);
    try {
      const year = gradYear ? Number(gradYear) : null;
      await apiPatch<{ user: Me }>("/auth/me", {
        onboardingDone: true,
        ...(educationLevel ? { educationLevel } : {}),
        ...(institution ? { institution } : {}),
        ...(fieldOfStudy ? { fieldOfStudy } : {}),
        ...(year ? { gradYear: year } : {}),
      });
      await refresh();
      notifySuccess(done ? "You're all set." : "Saved — you can add this later in Profile.");
      router.replace("/dashboard");
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Could not save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="grid min-h-dvh place-items-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-12">
      <div className="mb-6 flex items-center gap-2" aria-hidden>
        {[0, 1].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-brand-600" : "bg-slate-200"}`} />
        ))}
      </div>

      {step === 0 ? (
        <section className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-elev1">
          <p className="text-sm font-semibold text-brand-700">Step 1 of 2</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink-900">Welcome, {user.firstName}</h1>
          <p className="mt-3 text-[15px] text-slate-600">
            Your workspace brings together the courses you&apos;re enrolled in, live sessions with your mentors, and your
            learning progress. Next we&apos;ll ask a couple of optional questions so we can tailor things to you.
          </p>
          <ul className="mt-5 space-y-2 text-sm text-slate-600">
            <li>• Track progress across your enrolled courses</li>
            <li>• Join live mentor sessions</li>
            <li>• Manage your profile and account security</li>
          </ul>
          <div className="mt-8 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => void submit(false)} loading={saving}>
              Skip for now
            </Button>
            <Button onClick={() => setStep(1)}>Continue</Button>
          </div>
        </section>
      ) : (
        <section className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-elev1">
          <p className="text-sm font-semibold text-brand-700">Step 2 of 2</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink-900">A little about you</h1>
          <p className="mt-2 text-sm text-slate-500">All optional — change any of it later in your profile.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="onb-education" className="mb-1 block text-sm font-semibold text-ink-700">
                Education level
              </label>
              <select
                id="onb-education"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
              >
                <option value="">Prefer not to say</option>
                {EDUCATION.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="onb-institution" className="mb-1 block text-sm font-semibold text-ink-700">
                Institution
              </label>
              <Input id="onb-institution" value={institution} maxLength={160} onChange={(e) => setInstitution(e.target.value)} placeholder="e.g. IIT Delhi" />
            </div>
            <div>
              <label htmlFor="onb-field" className="mb-1 block text-sm font-semibold text-ink-700">
                Field of study
              </label>
              <Input id="onb-field" value={fieldOfStudy} maxLength={160} onChange={(e) => setFieldOfStudy(e.target.value)} placeholder="e.g. Computer Science" />
            </div>
            <div>
              <label htmlFor="onb-year" className="mb-1 block text-sm font-semibold text-ink-700">
                Graduation year
              </label>
              <Input
                id="onb-year"
                type="number"
                inputMode="numeric"
                min={1950}
                max={2100}
                value={gradYear}
                onChange={(e) => setGradYear(e.target.value)}
                placeholder="e.g. 2026"
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button variant="ghost" onClick={() => setStep(0)} disabled={saving}>
              Back
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => void submit(false)} loading={saving}>
                Skip
              </Button>
              <Button onClick={() => void submit(true)} loading={saving}>
                Finish
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
