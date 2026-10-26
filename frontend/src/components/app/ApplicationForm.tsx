"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Category from "@mui/icons-material/Category";
import AttachFile from "@mui/icons-material/AttachFile";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import type { Application } from "@/lib/app-types";
import { cn } from "@/lib/cn";
import { notifyError } from "@/lib/notify";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import Dropzone from "@/components/ui/Dropzone";
import Select from "@/components/ui/Select";
import { buttonClass } from "@/components/ui/Button";
import SubmitApplicationButton from "@/components/ui/SubmitApplicationButton";
import { useAuth } from "./AuthProvider";
import MobileVerification from "./MobileVerification";

interface CourseOption {
  id: string;
  slug: string;
  title: string;
  category: string;
}

const ACCEPT = ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPE = /^(application|image|text)\//;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

export default function ApplicationForm({ initialCourseSlug }: { initialCourseSlug?: string } = {}) {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseOption[] | null>(null);
  const [apps, setApps] = useState<Application[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [courseId, setCourseId] = useState("");
  const [qualification, setQualification] = useState("");
  const [message, setMessage] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [needsMobile, setNeedsMobile] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitted = useRef(false);
  const { user } = useAuth();

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [catalog, appData] = await Promise.all([
        apiGet<{ items: CourseOption[] }>("/courses", { limit: 50 }),
        apiGet<{ applications: Application[] }>("/applications/mine"),
      ]);
      setCourses(catalog.items);
      setApps(appData.applications);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load courses.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const blocked = useMemo(
    () => new Set((apps ?? []).filter((a) => a.status !== "REJECTED").map((a) => a.course.id)),
    [apps],
  );
  const available = useMemo(() => (courses ?? []).filter((c) => !blocked.has(c.id)), [courses, blocked]);

  // Preselect when arriving from a course page (?course=<slug>).
  useEffect(() => {
    if (!initialCourseSlug) return;
    const match = available.find((c) => c.slug === initialCourseSlug);
    if (match) setCourseId((cur) => cur || match.id);
  }, [initialCourseSlug, available]);

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!courseId) errs.courseId = "Choose a course.";
    const q = qualification.trim();
    if (q.length < 10) errs.qualification = "Describe your qualification (at least 10 characters).";
    else if (q.length > 3000) errs.qualification = "Keep this under 3000 characters.";
    if (!resume) errs.resume = "Attach your resume.";
    else if (!ALLOWED_TYPE.test(resume.type)) errs.resume = "Use a PDF, DOC, DOCX, TXT, or image file.";
    else if (resume.size > MAX_BYTES) errs.resume = "File must be 5 MB or smaller.";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !validate() || !resume) return;

    setBusy(true);
    setSubmitError(null);
    setNeedsMobile(false);
    try {
      const data = await fileToBase64(resume);
      const { application } = await apiPost<{ application: Application }>("/applications", {
        courseId,
        qualification: qualification.trim(),
        message: message.trim() ? message.trim() : null,
        resume: { name: resume.name, type: resume.type, data },
      });
      submitted.current = true;
      const slug = available.find((c) => c.id === courseId)?.slug;
      router.push(slug ? `/courses/${slug}` : `/dashboard/mentor/applications/${application.id}`);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "MOBILE_VERIFICATION_REQUIRED") {
          setNeedsMobile(true);
        } else if (err.code === "APPLICATION_EXISTS" || err.code === "ALREADY_PARTICIPANT") {
          notifyError(err.message);
          setCourseId("");
          setResume(null);
          await load();
        } else if (err.code === "VALIDATION_ERROR" && err.details) {
          setSubmitError(err.message);
        } else {
          setSubmitError(err.message);
        }
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
      setBusy(false);
    }
  }

  if (loadError) return <ErrorState message={loadError} onRetry={() => void load()} />;
  if (!courses || !apps) return <Spinner label="Loading application form…" />;

  if (user && !user.mobileVerifiedAt) {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <header>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Apply to mentor</h1>
          <p className="mt-1 text-sm text-slate-500">
            Choose a course and tell us about your expertise. Submission does not grant teaching
            access — a reviewer assesses every application.
          </p>
        </header>
        <div className="rounded-[20px] border border-amber-200 bg-amber-50 p-5">
          <p className="font-semibold text-amber-900">Verify your mobile number to continue</p>
          <p className="mt-1 text-sm text-amber-800">
            We ask for a verified mobile number before you can apply to mentor. The application form
            unlocks automatically as soon as your number is verified.
          </p>
        </div>
        <div className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-elev1">
          <MobileVerification />
        </div>
      </div>
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-ink-900">Apply to mentor</h1>
        <p className="mt-1 text-sm text-slate-500">
          Choose a course and tell us about your expertise. Submission does not grant teaching
          access — a reviewer assesses every application.
        </p>
      </header>

      {needsMobile && (
        <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Verify your mobile number before applying.{" "}
          <Link href="/dashboard/settings" className="font-semibold underline">
            Go to settings
          </Link>
        </p>
      )}

      {available.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
          You already have an open application for every published course. You can apply again only
          after a previous application is rejected, or for a new course.
        </p>
      ) : (
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="courseId" className="text-sm font-semibold text-ink-700">
              Course <span className="text-danger">*</span>
            </label>
            <Select
              id="courseId"
              name="courseId"
              value={courseId}
              error={Boolean(fieldErrors.courseId)}
              icon={<Category fontSize="small" />}
              onChange={(e) => setCourseId(e.target.value)}
            >
              <option value="">Select a course…</option>
              {available.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} — {c.category}
                </option>
              ))}
            </Select>
            {fieldErrors.courseId && <p className="text-sm text-danger">{fieldErrors.courseId}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="qualification" className="text-sm font-semibold text-ink-700">
              Qualification <span className="text-danger">*</span>
            </label>
            <textarea
              id="qualification"
              name="qualification"
              rows={5}
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="Describe your relevant experience and subject expertise…"
              className={cn(
                "w-full rounded-xl border bg-white px-4 py-3 text-[15px] outline-none transition focus:ring-2",
                fieldErrors.qualification
                  ? "border-danger focus:border-danger focus:ring-danger/20"
                  : "border-slate-300 focus:border-brand-600 focus:ring-brand-600/20",
              )}
              aria-invalid={fieldErrors.qualification ? true : undefined}
            />
            <p className="text-xs text-slate-400">{qualification.trim().length}/3000</p>
            {fieldErrors.qualification && <p className="text-sm text-danger">{fieldErrors.qualification}</p>}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="message" className="text-sm font-semibold text-ink-700">
              Message <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="message"
              name="message"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Anything you'd like the reviewer to know…"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[15px] outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="resume" className="text-sm font-semibold text-ink-700">
              Resume <span className="text-danger">*</span>
            </label>
            <Dropzone
              id="resume"
              name="resume"
              accept={ACCEPT}
              error={!!fieldErrors.resume}
              icon={<AttachFile fontSize="small" />}
              file={resume}
              hint="PDF, DOC, DOCX, TXT or image · up to 5 MB"
              onFile={setResume}
            />
            {fieldErrors.resume && <p className="text-sm text-danger">{fieldErrors.resume}</p>}
          </div>

          {submitError && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {submitError}
            </p>
          )}

          <div className="flex items-center gap-3">
            <SubmitApplicationButton loading={busy}>Submit application</SubmitApplicationButton>
            <Link href="/dashboard/mentor" className={buttonClass("ghost", "md")}>
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
