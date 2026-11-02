"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPatch, ApiError } from "@/lib/api";
import { useAuth } from "@/components/app/AuthProvider";
import { notifyError, notifySuccess } from "@/lib/notify";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import AvatarUploader from "./AvatarUploader";
import ResumeUploader from "./ResumeUploader";
import type { Me } from "@/lib/app-types";

const EDUCATION = ["School", "Undergraduate", "Postgraduate", "Professional", "Other"];

export default function OnboardingFlow() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 fields
  const [username, setUsername] = useState("");
  const [mobile, setMobile] = useState("");

  // Step 2 fields
  const [educationLevel, setEducationLevel] = useState("");
  const [institution, setInstitution] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [experience, setExperience] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=%2Fonboarding");
      return;
    }
    if (user.onboardingDone) {
      router.replace("/dashboard");
      return;
    }
    setUsername(user.username ?? "");
    setMobile(user.mobile ?? "");
    setEducationLevel(user.educationLevel ?? "");
    setInstitution(user.institution ?? "");
    setFieldOfStudy(user.fieldOfStudy ?? "");
    setGradYear(user.gradYear ? String(user.gradYear) : "");
    setExperience(user.experience ?? "");
  }, [loading, user, router]);

  async function saveStep1() {
    if (username.trim()) {
      setSaving(true);
      try {
        await apiPatch<{ user: Me }>("/auth/me", {
          username: username.trim(),
          ...(mobile.trim() ? { mobile: mobile.trim() } : {}),
        });
        await refresh();
        setStep(1);
      } catch (err) {
        if (err instanceof ApiError && err.code === "USERNAME_TAKEN") {
          notifyError("That username is taken. Try another.");
        } else {
          notifyError(err instanceof Error ? err.message : "Could not save username.");
        }
      } finally {
        setSaving(false);
      }
    } else {
      setStep(1);
    }
  }

  async function submit(done: boolean) {
    setSaving(true);
    try {
      const year = gradYear ? Number(gradYear) : null;
      await apiPatch<{ user: Me }>("/auth/me", {
        onboardingDone: true,
        ...(username.trim() ? { username: username.trim() } : {}),
        ...(mobile.trim() ? { mobile: mobile.trim() } : {}),
        ...(educationLevel ? { educationLevel } : {}),
        ...(institution.trim() ? { institution: institution.trim() } : {}),
        ...(fieldOfStudy.trim() ? { fieldOfStudy: fieldOfStudy.trim() } : {}),
        ...(year ? { gradYear: year } : {}),
        ...(experience.trim() ? { experience: experience.trim() } : {}),
      });
      await refresh();
      notifySuccess(done ? "You're all set!" : "Saved — you can update this anytime in Profile.");
      router.replace("/dashboard");
    } catch (err) {
      if (err instanceof ApiError && err.code === "USERNAME_TAKEN") {
        notifyError("That username is taken. Return to Step 1 to choose another.");
      } else {
        notifyError(err instanceof Error ? err.message : "Could not complete onboarding. Please try again.");
      }
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
        <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-ink-900">Welcome, {user.firstName}</h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-wider text-ink-500">Step 1 of 2 · Basic profile</p>
          <p className="mt-2 text-sm text-slate-600">
            Let&apos;s set up your profile picture, unique username, and contact details.
          </p>

          <div className="mt-6 space-y-6">
            <div>
              <label className="mb-2 block text-xs font-medium text-slate-600">
                Profile photo
              </label>
              <AvatarUploader avatarUrl={user.avatarUrl} firstName={user.firstName} lastName={user.lastName} />
            </div>

            <div>
              <label htmlFor="onb-username" className="mb-1 block text-sm font-semibold text-ink-700">
                Username (optional)
              </label>
              <Input
                id="onb-username"
                value={username}
                maxLength={30}
                placeholder="Choose a username (e.g. rohan_v)"
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, ""))}
              />
              <p className="mt-1 text-xs text-slate-400">Letters, numbers, underscores and dots only</p>
            </div>

            <div>
              <label htmlFor="onb-mobile" className="mb-1 block text-sm font-semibold text-ink-700">
                Mobile number (optional)
              </label>
              <Input
                id="onb-mobile"
                value={mobile}
                maxLength={20}
                placeholder="+91 98765 43210"
                onChange={(e) => setMobile(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-400">Used for mentor sessions and course updates</p>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
            <Button variant="ghost" onClick={() => void submit(false)} loading={saving}>
              Skip for now
            </Button>
            <Button onClick={() => void saveStep1()} loading={saving}>
              Continue to Step 2
            </Button>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold text-ink-900">Education, experience &amp; resume</h1>
          <p className="mt-1 text-xs font-medium uppercase tracking-wider text-ink-500">Step 2 of 2 · Background</p>
          <p className="mt-2 text-sm text-slate-500">
            Help us personalize your learning path, or prepare your profile for mentor applications.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="onb-education" className="mb-1 block text-sm font-semibold text-ink-700">
                Education level
              </label>
              <Select
                id="onb-education"
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
              >
                <option value="">Prefer not to say</option>
                {EDUCATION.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="onb-institution" className="mb-1 block text-sm font-semibold text-ink-700">
                  Institution
                </label>
                <Input
                  id="onb-institution"
                  value={institution}
                  maxLength={160}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="e.g. IIT Delhi"
                />
              </div>
              <div>
                <label htmlFor="onb-field" className="mb-1 block text-sm font-semibold text-ink-700">
                  Field of study
                </label>
                <Input
                  id="onb-field"
                  value={fieldOfStudy}
                  maxLength={160}
                  onChange={(e) => setFieldOfStudy(e.target.value)}
                  placeholder="e.g. Computer Science"
                />
              </div>
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
                placeholder="e.g. 2025"
              />
            </div>

            <div>
              <label htmlFor="onb-experience" className="mb-1 block text-sm font-semibold text-ink-700">
                Experience &amp; Skills
              </label>
              <textarea
                id="onb-experience"
                value={experience}
                maxLength={3000}
                rows={3}
                onChange={(e) => setExperience(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                placeholder="Summary of projects, tools, engineering, creative arts, or teaching experience…"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-ink-700">
                Resume / CV (optional)
              </label>
              <ResumeUploader
                resumeName={user.resumeName}
                resumeUpdatedAt={user.resumeUpdatedAt}
              />
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-6">
            <Button variant="ghost" onClick={() => setStep(0)} disabled={saving}>
              Back
            </Button>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => void submit(false)} loading={saving}>
                Skip
              </Button>
              <Button onClick={() => void submit(true)} loading={saving}>
                Finish &amp; Go to Dashboard
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
