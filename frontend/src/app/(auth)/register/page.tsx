"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, type AuthResponse } from "@/lib/api";
import PasswordInput from "@/components/ui/PasswordInput";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    schoolName: "",
    className: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: Record<string, string> = {
        name: form.name,
        email: form.email,
        password: form.password,
      };
      if (form.schoolName) payload.schoolName = form.schoolName;
      if (form.className) payload.className = form.className;

      const data = await api<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      void data;

      // No auto-login: Supabase emails a confirmation link, and once the
      // user clicks it they sign in on the login page themselves.
      localStorage.setItem("eat:pending-verify", form.email);
      router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-elev2">
      <h1 className="font-display text-2xl font-bold text-ink-700">Create your account</h1>
      <p className="mt-1 text-sm text-slate-600">
        Join free — start learning in minutes. Want to mentor a course later? Apply{" "}
        <Link href="/teachers/apply" className="font-semibold text-brand-700 hover:text-brand-800">
          here
        </Link>
        .
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">

        <input
          required
          placeholder="Full name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <PasswordInput
          required
          minLength={8}
          placeholder="Password (min 8 characters)"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="w-full"
        />
        <input
          placeholder="School name (optional)"
          value={form.schoolName}
          onChange={(e) => setForm((f) => ({ ...f, schoolName: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <input
          placeholder="Class / section (e.g. 9-A)"
          value={form.className}
          onChange={(e) => setForm((f) => ({ ...f, className: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-600 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          Sign in
        </Link>
      </p>
    </div>
  );
}
