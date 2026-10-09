"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api";

type Fields = { name: string; email: string; phone: string; subject: string; body: string };
const EMPTY: Fields = { name: "", email: "", phone: "", subject: "", body: "" };

// Matches the backend schema in contact.routes.ts
function validate(f: Fields): Partial<Record<keyof Fields, string>> {
  const e: Partial<Record<keyof Fields, string>> = {};
  if (f.name.trim().length < 2) e.name = "Please enter your name (at least 2 characters).";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email.trim())) e.email = "Please enter a valid email address.";
  if (f.phone.trim().length > 20) e.phone = "Phone number is too long.";
  if (f.subject.trim().length > 200) e.subject = "Subject is too long.";
  if (f.body.trim().length < 5) e.body = "Please describe your inquiry (at least 5 characters).";
  return e;
}

const inputCls =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-[15px] text-ink-900 placeholder:text-slate-400 focus-visible:border-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/30 aria-[invalid=true]:border-red-400";

export default function InquiryForm() {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Fields, string>>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setFields((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    const errs = validate(fields);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setStatus("submitting");
    setMessage("");
    try {
      await api("/contact", {
        method: "POST",
        auth: false,
        body: {
          name: fields.name.trim(),
          email: fields.email.trim().toLowerCase(),
          phone: fields.phone.trim() || null,
          subject: fields.subject.trim() || null,
          body: fields.body.trim(),
        },
      });
      setFields(EMPTY);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof ApiError && err.code === "RATE_LIMITED"
          ? "Too many messages sent. Please wait a moment and try again."
          : err instanceof ApiError
            ? err.message
            : "Could not send your message. Please try again.",
      );
    }
  }

  if (status === "success") {
    return (
      <div role="status" className="rounded-2xl border border-brand-200 bg-brand-50 p-8 text-center">
        <h3 className="font-display text-xl font-bold text-ink-900">Message sent</h3>
        <p className="mx-auto mt-2 max-w-md text-ink-600">
          Thank you — we have received your inquiry and will get back to you by email.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-5 text-sm font-semibold text-brand-700 hover:text-brand-800"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="inq-name" className="mb-1.5 block text-sm font-semibold text-ink-700">
            Name
          </label>
          <input
            id="inq-name"
            value={fields.name}
            onChange={set("name")}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "inq-name-err" : undefined}
            className={inputCls}
            autoComplete="name"
          />
          {errors.name && (
            <p id="inq-name-err" className="mt-1 text-sm text-red-600">
              {errors.name}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="inq-email" className="mb-1.5 block text-sm font-semibold text-ink-700">
            Email
          </label>
          <input
            id="inq-email"
            type="email"
            value={fields.email}
            onChange={set("email")}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "inq-email-err" : undefined}
            className={inputCls}
            autoComplete="email"
          />
          {errors.email && (
            <p id="inq-email-err" className="mt-1 text-sm text-red-600">
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="inq-phone" className="mb-1.5 block text-sm font-semibold text-ink-700">
            Phone <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="inq-phone"
            value={fields.phone}
            onChange={set("phone")}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "inq-phone-err" : undefined}
            className={inputCls}
            autoComplete="tel"
          />
          {errors.phone && (
            <p id="inq-phone-err" className="mt-1 text-sm text-red-600">
              {errors.phone}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="inq-subject" className="mb-1.5 block text-sm font-semibold text-ink-700">
            Subject <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="inq-subject"
            value={fields.subject}
            onChange={set("subject")}
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? "inq-subject-err" : undefined}
            className={inputCls}
          />
          {errors.subject && (
            <p id="inq-subject-err" className="mt-1 text-sm text-red-600">
              {errors.subject}
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="inq-body" className="mb-1.5 block text-sm font-semibold text-ink-700">
          How can we help?
        </label>
        <textarea
          id="inq-body"
          rows={5}
          value={fields.body}
          onChange={set("body")}
          aria-invalid={Boolean(errors.body)}
          aria-describedby={errors.body ? "inq-body-err" : undefined}
          className={inputCls}
        />
        {errors.body && (
          <p id="inq-body-err" className="mt-1 text-sm text-red-600">
            {errors.body}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" loading={status === "submitting"} disabled={status === "submitting"}>
          Send message
        </Button>
        <p role="status" aria-live="polite" className="text-sm text-ink-600">
          {status === "error" && message}
        </p>
      </div>
    </form>
  );
}
