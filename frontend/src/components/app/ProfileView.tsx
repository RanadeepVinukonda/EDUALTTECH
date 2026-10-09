"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiPatch } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import AvatarUploader from "./AvatarUploader";
import { notifyError, notifySuccess } from "@/lib/notify";
import { formatDate } from "@/lib/format";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import type { Me } from "@/lib/app-types";

export default function ProfileView() {
  const { user, loading, refresh } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setBio(user.bio ?? "");
    setDateOfBirth(user.dateOfBirth ? user.dateOfBirth.slice(0, 10) : "");
  }, [user]);

  if (loading || !user) return <Spinner label="Loading your profile…" />;

  async function save() {
    if (!firstName.trim() || !lastName.trim()) {
      notifyError("First and last name are required.");
      return;
    }
    setSaving(true);
    try {
      await apiPatch<{ user: Me }>("/auth/me", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio: bio.trim() ? bio.trim() : null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
      });
      await refresh();
      notifySuccess("Profile updated.");
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink-900">Profile</h1>
        <p className="mt-1 text-[15px] text-slate-500">How you appear across EduAltTech.</p>
      </header>

      <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1">
        <AvatarUploader avatarUrl={user.avatarUrl} firstName={user.firstName} lastName={user.lastName} />
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1">
        <h2 className="font-display text-lg font-bold text-ink-900">Basic details</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-first" className="mb-1 block text-sm font-semibold text-ink-700">
              First name
            </label>
            <Input id="pf-first" value={firstName} maxLength={80} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="pf-last" className="mb-1 block text-sm font-semibold text-ink-700">
              Last name
            </label>
            <Input id="pf-last" value={lastName} maxLength={80} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="pf-dob" className="mb-1 block text-sm font-semibold text-ink-700">
              Date of birth
            </label>
            <Input id="pf-dob" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </div>
          <div>
            <label htmlFor="pf-email" className="mb-1 block text-sm font-semibold text-ink-700">
              Email
            </label>
            <Input id="pf-email" value={user.email} readOnly disabled />
            <p className="mt-1 text-xs text-slate-500">
              {user.emailVerifiedAt ? "Verified" : "Not verified"}
            </p>
          </div>
        </div>
        <div className="mt-4">
          <label htmlFor="pf-bio" className="mb-1 block text-sm font-semibold text-ink-700">
            About you
          </label>
          <textarea
            id="pf-bio"
            value={bio}
            maxLength={1000}
            rows={4}
            onChange={(e) => setBio(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            placeholder="A short bio (optional)"
          />
          <p className="mt-1 text-right text-xs text-slate-400">{bio.length}/1000</p>
        </div>
        <div className="mt-4">
          <Button onClick={() => void save()} loading={saving}>
            Save changes
          </Button>
        </div>
      </section>

      <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1">
        <h2 className="font-display text-lg font-bold text-ink-900">Phone &amp; security</h2>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink-900">
              {user.mobile ? user.mobile.replace(/(\d{2})\d+(\d{2})$/, "$1••••$2") : "No mobile number added"}
            </p>
            <p className="text-xs text-slate-500">
              {user.mobileVerifiedAt ? "Verified" : user.mobile ? "Not verified" : "Add and verify to purchase or apply as a mentor"}
            </p>
          </div>
          <Link href="/dashboard/settings" className="text-sm font-semibold text-brand-700 hover:underline">
            {user.mobileVerifiedAt ? "Manage in settings" : "Add mobile number"}
          </Link>
        </div>
      </section>

      <p className="text-xs text-slate-400">
        {user.role === "ADMIN" ? "Administrator" : "Member"} · joined {formatDate(user.createdAt, { dateStyle: "medium" })}
      </p>
    </div>
  );
}
