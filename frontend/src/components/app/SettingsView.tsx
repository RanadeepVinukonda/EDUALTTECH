"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiPatch } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import MobileVerification from "./MobileVerification";
import { notifyError, notifySuccess } from "@/lib/notify";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import type { Me } from "@/lib/app-types";

const EDUCATION = ["School", "Undergraduate", "Postgraduate", "Professional", "Other"];

export default function SettingsView() {
  const { user, loading, refresh, signOut } = useAuth();
  const router = useRouter();
  const [educationLevel, setEducationLevel] = useState("");
  const [institution, setInstitution] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEducationLevel(user.educationLevel ?? "");
    setInstitution(user.institution ?? "");
    setFieldOfStudy(user.fieldOfStudy ?? "");
    setGradYear(user.gradYear ? String(user.gradYear) : "");
  }, [user]);

  if (loading || !user) return <Spinner label="Loading settings…" />;

  async function saveLearning() {
    const year = gradYear ? Number(gradYear) : null;
    if (year !== null && (!Number.isInteger(year) || year < 1950 || year > 2100)) {
      notifyError("Enter a graduation year between 1950 and 2100.");
      return;
    }
    setSaving(true);
    try {
      await apiPatch<{ user: Me }>("/auth/me", {
        educationLevel: educationLevel || null,
        institution: institution.trim() || null,
        fieldOfStudy: fieldOfStudy.trim() || null,
        gradYear: year,
      });
      await refresh();
      notifySuccess("Learning profile saved.");
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Could not save your settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink-900">Account settings</h1>
        <p className="mt-1 text-[15px] text-slate-500">Manage your contact details, learning profile, and session.</p>
      </header>

      <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1">
        <h2 className="font-display text-lg font-bold text-ink-900">Account</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-ink-700">Email</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{user.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-ink-700">Account type</dt>
            <dd className="mt-1 text-[15px] text-slate-600">{user.role === "ADMIN" ? "Administrator" : "Member"}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1">
        <h2 className="font-display text-lg font-bold text-ink-900">Mobile number</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">
          Required to purchase paid courses or apply as a mentor. We only ask when you need it.
        </p>
        <MobileVerification />
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1">
        <h2 className="font-display text-lg font-bold text-ink-900">Learning profile</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="set-education" className="mb-1 block text-sm font-semibold text-ink-700">
              Education level
            </label>
            <select
              id="set-education"
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
            <label htmlFor="set-year" className="mb-1 block text-sm font-semibold text-ink-700">
              Graduation year
            </label>
            <Input id="set-year" type="number" inputMode="numeric" min={1950} max={2100} value={gradYear} onChange={(e) => setGradYear(e.target.value)} />
          </div>
          <div>
            <label htmlFor="set-institution" className="mb-1 block text-sm font-semibold text-ink-700">
              Institution
            </label>
            <Input id="set-institution" value={institution} maxLength={160} onChange={(e) => setInstitution(e.target.value)} />
          </div>
          <div>
            <label htmlFor="set-field" className="mb-1 block text-sm font-semibold text-ink-700">
              Field of study
            </label>
            <Input id="set-field" value={fieldOfStudy} maxLength={160} onChange={(e) => setFieldOfStudy(e.target.value)} />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={() => void saveLearning()} loading={saving}>
            Save
          </Button>
        </div>
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1">
        <h2 className="font-display text-lg font-bold text-ink-900">Session</h2>
        <p className="mb-4 mt-1 text-sm text-slate-500">Sign out on this device.</p>
        <Button variant="secondary" onClick={() => void signOut().then(() => router.replace("/"))}>
          Sign out
        </Button>
      </section>
    </div>
  );
}
