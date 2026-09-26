"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, getCachedUser, clearAuth, updateCachedUser, nextAuthPath, type User } from "@/lib/api";
import { Loader } from "@/components/Loader";
import PasswordInput from "@/components/ui/PasswordInput";
import { useMinLoading } from "@/lib/useMinLoading";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [form, setForm] = useState({ name: "", schoolName: "", className: "", education: "", bio: "" });
  const [topics, setTopics] = useState("");
  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const loading = useMinLoading(user !== null);

  useEffect(() => {
    const cached = getCachedUser();
    if (!cached) {
      router.replace("/login");
      return;
    }
    setUser(cached);
    setForm({
      name: cached.name,
      schoolName: cached.schoolName ?? "",
      className: cached.className ?? "",
      education: cached.education ?? "",
      bio: cached.bio ?? "",
    });
    setTopics((cached.interestedTopics ?? []).join(", "));
  }, [router]);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        interestedTopics: topics
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 20),
      };
      for (const key of ["schoolName", "className", "education", "bio"] as const) {
        if (form[key].trim()) payload[key] = form[key].trim();
      }
      const data = await api<{ user: User }>("/auth/me", { method: "PATCH", body: JSON.stringify(payload) });
      updateCachedUser(data.user);
      setUser(data.user);
      setMessage("Profile updated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your profile");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await api("/auth/change-password", { method: "POST", body: JSON.stringify(pwd) });
      clearAuth();
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not change your password");
      setBusy(false);
    }
  }

  if (!user) return <Loader />;
  if (loading) return <Loader />;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-slate-900">Your profile</h1>
      <p className="mt-1 text-slate-600">
        Signed in as {user.email}
        {user.role === "USER" && !user.onboardingDone && (
          <>
            {" · "}
            <Link href={nextAuthPath(user)} className="font-semibold text-brand-700 hover:text-brand-800">
              finish setup
            </Link>
          </>
        )}
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {message && <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-800">{message}</p>}

      <form onSubmit={saveProfile} className="mt-8 space-y-4 rounded-3xl border border-slate-200 bg-white p-8">
        <h2 className="font-display text-lg font-semibold text-slate-900">Details</h2>
        <Field label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} required />
        <Field label="School / college" value={form.schoolName} onChange={(v) => setForm((f) => ({ ...f, schoolName: v }))} />
        <Field label="Class / year" value={form.className} onChange={(v) => setForm((f) => ({ ...f, className: v }))} />
        <Field label="Current level" value={form.education} onChange={(v) => setForm((f) => ({ ...f, education: v }))} />
        <Field label="Subjects (comma separated)" value={topics} onChange={setTopics} />
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">About you</label>
          <textarea
            rows={3}
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl brand-grad px-6 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Save changes
        </button>
      </form>

      <form onSubmit={changePassword} className="mt-6 space-y-4 rounded-3xl border border-slate-200 bg-white p-8">
        <h2 className="font-display text-lg font-semibold text-slate-900">Change password</h2>
        <p className="text-sm text-slate-500">You&apos;ll be signed out everywhere after changing it.</p>
        <Field label="Current password" type="password" value={pwd.currentPassword} onChange={(v) => setPwd((p) => ({ ...p, currentPassword: v }))} required />
        <Field label="New password" type="password" value={pwd.newPassword} onChange={(v) => setPwd((p) => ({ ...p, newPassword: v }))} required />
        <button
          type="submit"
          disabled={busy || pwd.newPassword.length < 8}
          className="rounded-xl border border-slate-300 px-6 py-2.5 font-semibold text-slate-700 hover:border-brand-400 hover:text-brand-700 disabled:opacity-50"
        >
          Update password
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {type === "password" ? (
        <PasswordInput id={id} required={required} value={value} onChange={(e) => onChange(e.target.value)} className="w-full" />
      ) : (
        <input
          id={id}
          type={type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
      )}
    </div>
  );
}