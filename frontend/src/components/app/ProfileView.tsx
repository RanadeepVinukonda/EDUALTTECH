"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Edit from "@mui/icons-material/Edit";
import Close from "@mui/icons-material/Close";
import PersonOutlined from "@mui/icons-material/PersonOutlined";
import MailOutlined from "@mui/icons-material/MailOutlined";
import CalendarMonth from "@mui/icons-material/CalendarMonth";
import { apiPatch } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import AvatarUploader from "./AvatarUploader";
import LearningProfileCard from "./LearningProfileCard";
import { notifyError, notifySuccess } from "@/lib/notify";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Spinner from "@/components/ui/Spinner";
import type { Me } from "@/lib/app-types";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <div className="mt-1 text-[15px] font-medium text-ink-900">{value}</div>
    </div>
  );
}

export default function ProfileView() {
  const { user, loading, refresh } = useAuth();
  const [editing, setEditing] = useState(false);
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
      setEditing(false);
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Could not save your profile.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold text-ink-900">Profile</h1>
          <p className="mt-1 text-[15px] text-slate-500">Your details across EduAltTech.</p>
        </div>
        {!editing && (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            <Edit fontSize="small" />
            Edit profile
          </Button>
        )}
        {editing && (
          <Button variant="ghost" onClick={() => setEditing(false)}>
            <Close fontSize="small" />
            Cancel
          </Button>
        )}
      </header>

      <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1 sm:p-8">
        <div className="flex flex-wrap items-center gap-6">
          <AvatarUploader avatarUrl={user.avatarUrl} firstName={user.firstName} lastName={user.lastName} />
          <div className="min-w-0">
            <p className="font-display text-2xl font-bold text-ink-900">{user.name}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
            <p className="mt-1 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-ink-700">
              {user.role === "ADMIN" ? "Administrator" : "Member"}
            </p>
          </div>
        </div>
      </section>

      {editing ? (
        <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1 sm:p-8">
          <h2 className="font-display text-lg font-bold text-ink-900">Edit details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="pf-first" className="mb-1 block text-sm font-semibold text-ink-700">
                First name
              </label>
              <Input id="pf-first" value={firstName} maxLength={80} icon={<PersonOutlined fontSize="small" />} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="pf-last" className="mb-1 block text-sm font-semibold text-ink-700">
                Last name
              </label>
              <Input id="pf-last" value={lastName} maxLength={80} icon={<PersonOutlined fontSize="small" />} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="pf-dob" className="mb-1 block text-sm font-semibold text-ink-700">
                Date of birth
              </label>
              <Input id="pf-dob" type="date" value={dateOfBirth} icon={<CalendarMonth fontSize="small" />} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
            <div>
              <label htmlFor="pf-email" className="mb-1 block text-sm font-semibold text-ink-700">
                Email
              </label>
              <Input id="pf-email" value={user.email} readOnly disabled icon={<MailOutlined fontSize="small" />} />
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
          <div className="mt-5 flex gap-3">
            <Button onClick={() => void save()} loading={saving}>
              Save changes
            </Button>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </section>
      ) : (
        <section className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-elev1 sm:p-8">
          <h2 className="font-display text-lg font-bold text-ink-900">Your details</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Email" value={user.email} />
            <Field
              label="Mobile"
              value={user.mobile ? user.mobile.replace(/(\d{2})\d+(\d{2})$/, "$1••••$2") : "Not added"}
            />
            <Field label="Date of birth" value={user.dateOfBirth ? formatDate(user.dateOfBirth, { dateStyle: "medium" }) : "Not set"} />
            <Field label="Joined" value={formatDate(user.createdAt, { dateStyle: "medium" })} />
            <Field label="Member since" value={`${new Date(user.createdAt).getFullYear()}`} />
            <Field
              label="Email status"
              value={
                <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", user.emailVerifiedAt ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700")}>
                  {user.emailVerifiedAt ? "Verified" : "Not verified"}
                </span>
              }
            />
          </div>
          {user.bio && (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">About you</p>
              <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-700">{user.bio}</p>
            </div>
          )}
          {user.mobileVerifiedAt === false && (
            <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Want to buy courses or apply as a mentor?{" "}
              <Link href="/dashboard/settings" className="font-semibold text-brand-700 hover:underline">
                Add your mobile number
              </Link>
              .
            </p>
          )}
        </section>
      )}

      <LearningProfileCard />
    </div>
  );
}