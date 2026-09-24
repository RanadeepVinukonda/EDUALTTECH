"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import PasswordInput from "@/components/ui/PasswordInput";
import EmailVerifyModal from "@/components/auth/EmailVerifyModal";

const BOARDS = ["", "CBSE", "ICSE / CISCE", "State Board", "International (IB / IGCSE)", "Other"];
const CLASSES = ["", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12", "Higher education"];
const QUALIFICATIONS = [
  "",
  "Diploma / Vocational",
  "B.E. / B.Tech.",
  "B.Sc.",
  "B.A. / B.Com.",
  "M.E. / M.Tech.",
  "M.Sc.",
  "M.B.A.",
  "Ph.D. / Post-graduate",
  "Other",
];

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    educationLevel: "School (class 6-12)",
    educationBoard: "",
    educationClass: "",
    qualification: "",
    degree: "",
    college: "",
    gradYear: "",
    skills: "",
  });
  const [emailVerified, setEmailVerified] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const phoneValid = form.phone === "" || /^\+?\d{7,15}$/.test(form.phone.replace(/[\s-()]/g, ""));
  const canSubmit =
    emailVerified &&
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    form.password.length >= 8 &&
    phoneValid;

  const set = (field: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  function educationSummary(): string {
    if (form.educationClass === "Higher education" || (form.qualification && !form.educationClass)) {
      return ["Higher education", form.qualification, form.degree, form.college].filter(Boolean).join(" · ");
    }
    return [form.educationClass, form.educationBoard].filter(Boolean).join(" · ");
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
      };
      if (form.phone.trim()) payload.phone = form.phone.trim();

      const education = educationSummary();
      if (education) payload.education = education;
      if (form.educationBoard) payload.educationBoard = form.educationBoard;
      if (form.educationClass) payload.educationClass = form.educationClass;
      if (form.qualification) payload.qualification = form.qualification;
      if (form.degree.trim()) payload.degree = form.degree.trim();
      if (form.college.trim()) payload.college = form.college.trim();
      const year = Number(form.gradYear);
      if (year) payload.gradYear = year;
      const skills = form.skills.split(",").map((s) => s.trim()).filter(Boolean);
      if (skills.length) payload.interestedTopics = skills;

      await api("/auth/register", { method: "POST", body: JSON.stringify(payload) });

      // Email is already verified by code, so straight to sign-in.
      router.push("/login?created=1&email=" + encodeURIComponent(form.email.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const higherEd = form.educationClass === "Higher education";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-elev2">
      <h1 className="font-display text-2xl font-bold text-ink-700">Create your account</h1>
      <p className="mt-1 text-sm text-slate-600">
        Join free — start learning in minutes. Want to mentor? Pick a course and apply right from its page.
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-slate-700">First name</label>
            <input
              id="firstName"
              required
              placeholder="Ravi"
              value={form.firstName}
              onChange={set("firstName")}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-slate-700">Last name</label>
            <input
              id="lastName"
              required
              placeholder="Kumar"
              value={form.lastName}
              onChange={set("lastName")}
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700">Email</label>
          <div className="flex gap-2">
            <input
              id="email"
              type="email"
              required
              placeholder="you@school.in"
              value={form.email}
              disabled={emailVerified}
              onChange={(e) => {
                setForm((f) => ({ ...f, email: e.target.value }));
                setEmailVerified(false);
              }}
              className={`w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50 ${
                emailVerified ? "border-emerald-400 bg-emerald-50 text-emerald-900" : "border-slate-300 focus:border-brand-500"
              }`}
            />
            <button
              type="button"
              disabled={!emailValid || emailVerified}
              onClick={() => setShowVerify(true)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
                emailVerified ? "bg-emerald-100 text-emerald-800" : "bg-brand-600 text-white hover:bg-brand-700"
              }`}
            >
              {emailVerified ? "Verified ✓" : "Verify"}
            </button>
          </div>
          {emailVerified && (
            <p className="mt-1 text-xs text-emerald-700">Email confirmed. You&apos;re all set to create the account.</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium text-slate-700">Phone (optional)</label>
          <div className="flex gap-2">
            <input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              value={form.phone}
              onChange={set("phone")}
              className={inputCls}
            />
            <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-400">
              OTP coming soon
            </span>
          </div>
          {!phoneValid && <p className="mt-1 text-xs text-red-600">Enter a valid mobile number</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700">
            Password (min 8 characters, one letter + one number)
          </label>
          <PasswordInput
            id="password"
            required
            minLength={8}
            placeholder="••••••••"
            value={form.password}
            onChange={set("password")}
            className="w-full"
          />
        </div>

        <fieldset className="rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          <legend className="px-2 text-sm font-semibold text-slate-700">Your education & interests (optional)</legend>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="educationClass" className="mb-1 block text-sm font-medium text-slate-700">Level</label>
              <select id="educationClass" value={form.educationClass} onChange={set("educationClass")} className={inputCls}>
                {CLASSES.map((c) => (
                  <option key={c} value={c}>{c || "Select level"}</option>
                ))}
              </select>
            </div>
            {higherEd ? (
              <>
                <div>
                  <label htmlFor="qualification" className="mb-1 block text-sm font-medium text-slate-700">Qualification</label>
                  <select id="qualification" value={form.qualification} onChange={set("qualification")} className={inputCls}>
                    {QUALIFICATIONS.map((q) => (
                      <option key={q} value={q}>{q || "Select qualification"}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="degree" className="mb-1 block text-sm font-medium text-slate-700">Degree / pursuing</label>
                  <input id="degree" placeholder="B.Tech Computer Science" value={form.degree} onChange={set("degree")} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="college" className="mb-1 block text-sm font-medium text-slate-700">College / institution</label>
                  <input id="college" placeholder="IIT Delhi" value={form.college} onChange={set("college")} className={inputCls} />
                </div>
                <div>
                  <label htmlFor="gradYear" className="mb-1 block text-sm font-medium text-slate-700">Graduation year</label>
                  <input id="gradYear" type="number" min={1960} max={2100} placeholder="2027" value={form.gradYear} onChange={set("gradYear")} className={inputCls} />
                </div>
              </>
            ) : (
              <div>
                <label htmlFor="educationBoard" className="mb-1 block text-sm font-medium text-slate-700">Board</label>
                <select id="educationBoard" value={form.educationBoard} onChange={set("educationBoard")} className={inputCls}>
                  {BOARDS.map((b) => (
                    <option key={b} value={b}>{b || "Select board"}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="mt-4">
            <label htmlFor="skills" className="mb-1 block text-sm font-medium text-slate-700">
              Things you want to learn or teach (comma separated)
            </label>
            <input
              id="skills"
              placeholder="Programming, DSA, Physics, Spoken English, Exam prep…"
              value={form.skills}
              onChange={set("skills")}
              className={inputCls}
            />
            {form.skills.split(",").map((s) => s.trim()).filter(Boolean).length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {form.skills.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                  <span key={s} className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">{s}</span>
                ))}
              </div>
            )}
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={loading || !canSubmit}
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

      {showVerify && (
        <EmailVerifyModal
          email={form.email.trim()}
          onVerified={() => {
            setEmailVerified(true);
            setShowVerify(false);
          }}
          onClose={() => setShowVerify(false)}
        />
      )}
    </div>
  );
}