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
  "w-full rounded-[10px] border-[1.5px] border-slate-200 bg-transparent px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 placeholder:text-slate-400";

const selectCls =
  "w-full rounded-[10px] border-[1.5px] border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
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
    <div className="rounded-[20px] bg-white p-8 shadow-elev2">
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
          <label htmlFor="email" className="mb-1 block text-sm font-semibold text-slate-800">Email</label>
          <div className="flex gap-2">
            <div className="flex h-[50px] flex-1 items-center rounded-[10px] border-[1.5px] border-slate-200 px-3 transition focus-within:border-brand-500">
              <svg viewBox="0 0 32 32" className="h-5 w-5 shrink-0 text-slate-400" fill="currentColor" aria-hidden="true">
                <path d="m30.853 13.87a15 15 0 0 0 -29.729 4.082 15.1 15.1 0 0 0 12.876 12.918 15.6 15.6 0 0 0 2.016.13 14.85 14.85 0 0 0 7.715-2.145 1 1 0 1 0 -1.031-1.711 13.007 13.007 0 1 1 5.458-6.529 2.149 2.149 0 0 1 -4.158-.759v-10.856a1 1 0 0 0 -2 0v1.726a8 8 0 1 0 .2 10.325 4.135 4.135 0 0 0 7.83.274 15.2 15.2 0 0 0 .823-7.455zm-14.853 8.13a6 6 0 1 1 6-6 6.006 6.006 0 0 1 -6 6z" />
              </svg>
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
                className={`ml-2 h-full w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400 disabled:opacity-60 ${
                  emailVerified ? "text-emerald-800" : ""
                }`}
              />
            </div>
            <button
              type="button"
              disabled={!emailValid || emailVerified}
              onClick={() => setShowVerify(true)}
              className={`shrink-0 rounded-[10px] px-4 text-sm font-medium transition disabled:opacity-50 ${
                emailVerified ? "bg-emerald-100 text-emerald-800" : "bg-slate-900 text-white hover:bg-slate-800"
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
          <label htmlFor="phone" className="mb-1 block text-sm font-semibold text-slate-800">Phone (optional)</label>
          <div className="flex gap-2">
            <div className="flex h-[50px] flex-1 items-center rounded-[10px] border-[1.5px] border-slate-200 px-3 transition focus-within:border-brand-500">
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <rect x="7" y="2" width="10" height="20" rx="2" />
                <path d="M11 18h2" strokeLinecap="round" />
              </svg>
              <input
                id="phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={form.phone}
                onChange={set("phone")}
                className="ml-2 h-full w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>
            <span className="flex shrink-0 items-center rounded-[10px] border border-slate-200 px-3 text-xs font-medium text-slate-400">
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
          className="w-full rounded-[10px] bg-slate-900 py-3 text-[15px] font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
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