"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", school: "", subject: "", body: "", website: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { api } = await import("@/lib/api");
      const payload: Record<string, string> = {
        name: form.name,
        email: form.email,
        body: form.body,
      };
      if (form.school) payload.school = form.school;
      if (form.subject) payload.subject = form.subject;
      if (form.website) payload.website = form.website;
      await api("/contact", { method: "POST", body: JSON.stringify(payload) });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-brand-800">Message sent</h1>
        <p className="mt-3 text-slate-600">
          Thanks for reaching out! Our team will get back to you at {form.email} shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-slate-900">Talk to us</h1>
      <p className="mt-2 text-slate-600">
        Schools, teachers, parents — write to us about bringing Edu-Alt-Tech to your campus, or
        just email <a className="font-semibold text-brand-700" href="mailto:info@edualttech.com">info@edualttech.com</a>.
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-xl border border-slate-200 bg-white p-8 shadow-elev1">
        <p aria-hidden="true" className="absolute -left-[9999px] h-1 w-1 overflow-hidden">
          <label htmlFor="website">Leave this field empty</label>
          <input
            id="website"
            name="website"
            type="text"
            value={form.website}
            onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
            tabIndex={-1}
            autoComplete="off"
          />
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <input
            required
            placeholder="Your name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
        </div>
        <input
          placeholder="School / organization (optional)"
          value={form.school}
          onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <input
          placeholder="Subject (optional)"
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <textarea
          required
          rows={5}
          minLength={10}
          placeholder="Tell us about your school and what you need…"
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send message"}
        </button>
      </form>

      <div className="mt-12 rounded-xl border border-black/5 bg-slate-50 p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">The humans behind it</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          A small team of educators, engineers and mentors answers every message.
        </p>
        <Link href="/about" className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800">
          Meet the team →
        </Link>
      </div>
    </div>
  );
}
