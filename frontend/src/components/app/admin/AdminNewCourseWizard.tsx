"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import School from "@mui/icons-material/School";
import PlayCircle from "@mui/icons-material/PlayCircle";
import MenuBook from "@mui/icons-material/MenuBook";
import Assignment from "@mui/icons-material/Assignment";
import Quiz from "@mui/icons-material/Quiz";
import Groups from "@mui/icons-material/Groups";
import Add from "@mui/icons-material/Add";
import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";
import ArrowForward from "@mui/icons-material/ArrowForward";
import ArrowBack from "@mui/icons-material/ArrowBack";
import CurrencyRupee from "@mui/icons-material/CurrencyRupee";
import Image from "@mui/icons-material/Image";
import Category from "@mui/icons-material/Category";
import CloudUploadOutlined from "@mui/icons-material/CloudUploadOutlined";
import { apiPost, ApiError } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/notify";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/cn";
import Button, { buttonClass } from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { AdminHeader, Panel } from "./admin-ui";
import { MediaPicker } from "./cms-ui";
import MarkdownArticleViewer from "@/components/ui/MarkdownArticleViewer";

// ── Categories & Domains ──────────────────────────────────────────
export const CATEGORY_OPTIONS = [
  "Programming & Computer Science",
  "AI, Data Science & Machine Learning",
  "Web & Mobile Development",
  "Music & Audio Production",
  "Dance & Choreography",
  "Fine Arts & Graphic Design",
  "Business & Entrepreneurship",
  "Photography & Cinematography",
  "Languages & Communication",
  "Health, Fitness & Yoga",
  "Creative Writing & Content",
  "Other Alternate Skills",
];

export const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced", "All Levels"];

type OfferingKind = "RESOURCE" | "PAID_COURSE";

// Tutorial Sub-lesson item
interface TutorialSubLesson {
  id: string;
  title: string;
  summary: string;
  content: string; // Markdown / Notes / Images / Code
}

// Tutorial Chapter / Section
interface TutorialSection {
  id: string;
  title: string;
  summary: string;
  subLessons: TutorialSubLesson[];
}

// Course Module item (skeleton)
interface CourseMilestoneItem {
  id: string;
  title: string;
  type: "VIDEO" | "READING" | "ASSIGNMENT" | "QUIZ" | "LIVE";
  duration: string;
  mentorNotes: string; // Guidance for the mentor who will fill the contents
}

// Course Module / Week
interface CourseWeekModule {
  id: string;
  title: string; // e.g. "Week 1: Fundamentals of Python"
  summary: string;
  items: CourseMilestoneItem[];
}

export default function AdminNewCourseWizard() {
  const router = useRouter();

  // Mode selection: null (choose card), "RESOURCE" (Free Resource/Tutorial), "PAID_COURSE" (Structured Course)
  const [kind] = useState<OfferingKind>("PAID_COURSE");

  // Stepper: 1 = Details, 2 = Builder
  const [step, setStep] = useState<1 | 2>(1);

  // Common Course fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"EDUCATION" | "ALTERNATIVE_EDUCATION">("EDUCATION");
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [domain, setDomain] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [pickingMedia, setPickingMedia] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [draggingThumb, setDraggingThumb] = useState(false);
  const [showDirectUrlInput, setShowDirectUrlInput] = useState(false);

  // Paid Course specific
  const [priceRupees, setPriceRupees] = useState("");
  const [hasCertificate, setHasCertificate] = useState(true);

  // Course Skeleton Weeks - starts empty so admin structures syllabus manually from scratch
  const [modules, setModules] = useState<CourseWeekModule[]>([]);

  // Resource Sections & Sub-lessons - starts clean without mock articles
  const [sections, setSections] = useState<TutorialSection[]>([
    {
      id: "sec-1",
      title: "Section 1",
      summary: "",
      subLessons: [
        {
          id: "sub-1-1",
          title: "Introduction",
          summary: "",
          content: "",
        },
      ],
    },
  ]);

  // Active section and sub-lesson being edited
  const [activeSecId, setActiveSecId] = useState<string>("sec-1");
  const [activeSubId, setActiveSubId] = useState<string>("sub-1-1");
  const [livePreviewMode, setLivePreviewMode] = useState(false);

  // Resource Article Image Upload & Media Library state
  const articleImageInputRef = useRef<HTMLInputElement>(null);
  const [uploadingArticleImage, setUploadingArticleImage] = useState(false);
  const [pickingArticleMedia, setPickingArticleMedia] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived current sub-lesson
  const activeSubLesson = useMemo(() => {
    const sec = sections.find((s) => s.id === activeSecId) ?? sections[0];
    return sec?.subLessons.find((sub) => sub.id === activeSubId) ?? sec?.subLessons[0];
  }, [sections, activeSecId, activeSubId]);

  function insertTextIntoActiveSubLesson(textToInsert: string) {
    if (!activeSubLesson) return;
    setSections((prev) =>
      prev.map((s) =>
        s.id === activeSecId
          ? {
              ...s,
              subLessons: s.subLessons.map((sub) =>
                sub.id === activeSubLesson.id
                  ? {
                      ...sub,
                      content: sub.content ? `${sub.content}\n${textToInsert}` : textToInsert,
                    }
                  : sub,
              ),
            }
          : s,
      ),
    );
  }

  async function handleArticleImageFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notifyError("Please choose an image file (PNG, JPG, SVG, or WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notifyError("Image is too large — please upload an image under 5 MB.");
      return;
    }

    setUploadingArticleImage(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });

      const base64Data = dataUrl.slice(dataUrl.indexOf(",") + 1);
      const res = await apiPost<{ asset: { url: string } }>("/cms/admin/media/upload", {
        name: file.name,
        type: file.type,
        data: base64Data,
        kind: "image",
        category: "Tutorial Article",
      });
      if (!res.asset?.url) throw new Error("The upload did not return an image URL.");

      const cleanAlt = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      insertTextIntoActiveSubLesson(`\n![${cleanAlt}](${res.asset.url})\n*Figure: ${cleanAlt}*\n`);
      notifySuccess("Image inserted into article!");
    } catch (err) {
      notifyError(err instanceof ApiError ? err.message : "Could not upload the article image.");
    } finally {
      setUploadingArticleImage(false);
      if (articleImageInputRef.current) {
        articleImageInputRef.current.value = "";
      }
    }
  }

  // Validation
  const parsedPrice = Number(priceRupees);
  const hasValidPaidPrice =
    /^\d+(?:\.\d{1,2})?$/.test(priceRupees.trim()) &&
    Number.isFinite(parsedPrice) &&
    parsedPrice > 0;
  const pricePaise =
    kind === "RESOURCE" ? 0 : hasValidPaidPrice ? Math.round(parsedPrice * 100) : 0;
  const detailsValid =
    title.trim().length >= 3 &&
    description.trim().length >= 10 &&
    domain.trim().length >= 2 &&
    (kind === "RESOURCE" || hasValidPaidPrice);

  function commitTag(t: string) {
    const clean = t.trim().slice(0, 30);
    if (!clean) return;
    if (!tags.some((x) => x.toLowerCase() === clean.toLowerCase())) {
      setTags([...tags, clean]);
    }
    setTagDraft("");
  }

  async function handleThumbnailFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notifyError("Please choose an image file (PNG, JPG, or WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      notifyError("Image is too large — please upload an image under 5 MB.");
      return;
    }

    setUploadingThumb(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });

      const base64Data = dataUrl.slice(dataUrl.indexOf(",") + 1);
      const res = await apiPost<{ asset: { url: string } }>("/cms/admin/media/upload", {
        name: file.name,
        type: file.type,
        data: base64Data,
        kind: "image",
        category: "Course Thumbnail",
      });
      if (!res.asset?.url) throw new Error("The upload did not return an image URL.");
      setThumbnailUrl(res.asset.url);
      notifySuccess("Thumbnail uploaded successfully!");
    } catch (err) {
      notifyError(err instanceof ApiError ? err.message : "Could not upload the thumbnail.");
    } finally {
      setUploadingThumb(false);
    }
  }

  // ── SAVE FLOW ──────────────────────────────────────────────────
  async function handleFinalSubmit(status: "DRAFT" | "PUBLISHED") {
    if (!detailsValid) {
      notifyError("Please fill in the required course details.");
      setStep(1);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Build features list
      const features: string[] = [];
      if (kind === "RESOURCE") {
        features.push("100% Free Resource", "Self-paced Tutorials", `${sections.reduce((acc, s) => acc + s.subLessons.length, 0)} Lessons`);
      } else {
        if (hasCertificate) features.push("Certificate of Completion");
        features.push(`${modules.length} Weeks Duration`, "Mentor Guided", "Hands-on Assignments");
      }

      // Build initial chapters / topics / lessons tree
      let initialChapters: Array<{
        title: string;
        summary?: string | null;
        topics: Array<{
          title: string;
          summary?: string | null;
          lessons?: Array<{
            title: string;
            type: "VIDEO" | "READING";
            textContent?: string | null;
          }>;
        }>;
      }> = [];

      if (kind === "RESOURCE") {
        initialChapters = sections.map((sec) => ({
          title: sec.title,
          summary: sec.summary,
          topics: sec.subLessons.map((sub) => ({
            title: sub.title,
            summary: sub.summary,
            lessons: [
              {
                title: sub.title,
                type: "READING" as const,
                textContent: sub.content,
              },
            ],
          })),
        }));
      } else {
        // Structured course: Weeks -> Topic skeletons
        initialChapters = modules.map((m) => ({
          title: m.title,
          summary: m.summary,
          topics: m.items.map((item) => ({
            title:
              item.type !== "VIDEO" && item.type !== "READING" && item.duration
                ? `${item.title} (${item.duration})`
                : item.title,
            summary: `[${item.type}] ${item.mentorNotes}`,
            lessons: [
              {
                title: item.title,
                type: (item.type === "VIDEO" ? "VIDEO" : "READING") as "VIDEO" | "READING",
                textContent: `### Topic Outline\n\n- **Type:** ${item.type}\n${item.type !== "VIDEO" && item.type !== "READING" && item.duration ? `- **Duration:** ${item.duration}\n` : ""}- **Mentor Scope:** ${item.mentorNotes}\n\n*Note for Mentor: Please upload video/notes for this syllabus item.*`,
              },
            ],
          })),
        }));
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        type,
        category,
        domain: domain.trim(),
        level,
        tags,
        features: features.slice(0, 4),
        pricePaise,
        thumbnailUrl: thumbnailUrl.trim() || null,
        initialChapters,
      };

      const res = await apiPost<{ course: { id: string; slug: string } }>("/courses", payload);

      notifySuccess(
        status === "PUBLISHED"
          ? `${kind === "RESOURCE" ? "Tutorial resource" : "Paid course"} published successfully!`
          : `${kind === "RESOURCE" ? "Tutorial resource" : "Paid course"} saved as draft.`,
      );

      router.push(`/dashboard/admin/courses/${res.course.id}`);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError("Could not create the course. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ────────────────────────────────────────────────────────────────
  // STEPPER HEADER: "Course Details > Course Builder"
  // ────────────────────────────────────────────────────────────────
  const _stepTitle =
    kind === "RESOURCE"
      ? step === 1
        ? "Resource Details"
        : "Tutorials & Articles"
      : step === 1
        ? "Course Details"
        : "Course Builder";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Minimal Stepper / Navigation without background block */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-slate-500">
            {kind === "RESOURCE" ? "Free Resource" : "Paid Course"}
          </span>
          <span className="text-slate-300">/</span>
          <button
            type="button"
            onClick={() => setStep(1)}
            className={cn(
              "font-medium transition hover:underline",
              step === 1 ? "font-semibold text-ink-900" : "text-slate-500 hover:text-ink-900",
            )}
          >
            Course Details
          </button>
          <span className="text-slate-400 font-medium">&gt;</span>
          <button
            type="button"
            onClick={() => {
              if (detailsValid) setStep(2);
            }}
            className={cn(
              "font-medium transition",
              step === 2
                ? "font-semibold text-ink-900"
                : detailsValid
                  ? "text-slate-500 hover:text-ink-900 hover:underline cursor-pointer"
                  : "text-slate-400 cursor-not-allowed",
            )}
          >
            Course Builder
          </button>

        </div>

        {step === 2 && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              loading={saving}
              onClick={() => handleFinalSubmit("DRAFT")}
            >
              Save as Draft
            </Button>
            <Button
              size="sm"
              loading={saving}
              onClick={() => handleFinalSubmit("PUBLISHED")}
            >
              Publish Now
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* STEP 1: COURSE DETAILS FORM                                  */}
      {/* ──────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          <AdminHeader
            title={kind === "RESOURCE" ? "Resource Details" : "Course Details"}
            description={
              kind === "RESOURCE"
                ? "Provide the basic information for this free tutorial resource before structuring the lessons."
                : "Fill in the high-level course information. Next, you will assemble the curriculum and milestone skeleton."
            }
          />

          <Panel title="Basic Information">
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="mb-1 block text-sm font-semibold text-ink-700">
                  Course Title <span className="text-danger">*</span>
                </label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={
                    kind === "RESOURCE"
                      ? "e.g. Complete Python & DSA Handbook"
                      : "e.g. Full Stack Web Development Specialization"
                  }
                  maxLength={160}
                />
              </div>

              <div>
                <label htmlFor="description" className="mb-1 block text-sm font-semibold text-ink-700">
                  Description <span className="text-danger">*</span>
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Summarize what learners will achieve, prerequisites, and what topics will be covered…"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                />
                <p className="mt-1 text-xs text-slate-400">At least 10 characters.</p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="category" className="mb-1 block text-sm font-semibold text-ink-700">
                    Category (Domain) <span className="text-danger">*</span>
                  </label>
                  <Select
                    id="category"
                    value={category}
                    icon={<Category fontSize="small" />}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label htmlFor="domain" className="mb-1 block text-sm font-semibold text-ink-700">
                    Specific Sub-domain / Topic <span className="text-danger">*</span>
                  </label>
                  <Input
                    id="domain"
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    placeholder="e.g. Python, Classical Piano, Graphic Design"
                    maxLength={60}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="type" className="mb-1 block text-sm font-semibold text-ink-700">
                    Type of Skill
                  </label>
                  <Select
                    id="type"
                    value={type}
                    onChange={(e) => setType(e.target.value as "EDUCATION" | "ALTERNATIVE_EDUCATION")}
                  >
                    <option value="EDUCATION">Academic & Technical Education (Tech, Science, Math)</option>
                    <option value="ALTERNATIVE_EDUCATION">Alternative Education (Music, Dance, Arts, Writing)</option>
                  </Select>
                </div>

                <div>
                  <label htmlFor="level" className="mb-1 block text-sm font-semibold text-ink-700">
                    Difficulty Level
                  </label>
                  <Select
                    id="level"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    {LEVEL_OPTIONS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="mb-1 block text-sm font-semibold text-ink-700">
                  Tags
                </label>
                <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-300 bg-white p-2">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700"
                    >
                      {t}
                      <button
                        type="button"
                        onClick={() => setTags(tags.filter((x) => x !== t))}
                        className="text-slate-400 hover:text-danger"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    id="tags"
                    type="text"
                    value={tagDraft}
                    onChange={(e) => setTagDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        commitTag(tagDraft);
                      }
                    }}
                    placeholder="Add tag and press Enter…"
                    className="min-w-32 flex-1 bg-transparent px-2 py-1 text-sm outline-none"
                  />
                </div>
              </div>

              {/* Certificate Radio (Requested: only put certificates as radio button) */}
              {kind === "PAID_COURSE" && (
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
                  <span className="block text-sm font-semibold text-ink-800 mb-2">
                    Certificate of Completion
                  </span>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-ink-800">
                      <input
                        type="radio"
                        name="certificate"
                        checked={hasCertificate}
                        onChange={() => setHasCertificate(true)}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500"
                      />
                      <span>Certificate Included</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-ink-800">
                      <input
                        type="radio"
                        name="certificate"
                        checked={!hasCertificate}
                        onChange={() => setHasCertificate(false)}
                        className="h-4 w-4 text-brand-600 focus:ring-brand-500"
                      />
                      <span>No Certificate</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Price & Thumbnail */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="price" className="mb-1 block text-sm font-semibold text-ink-700">
                    Price (₹) {kind === "RESOURCE" && <span className="text-xs text-slate-400">(Free Resource)</span>}
                  </label>
                  <Input
                    id="price"
                    type="number"
                    min={0.01}
                    step={0.01}
                    required={kind !== "RESOURCE"}
                    value={kind === "RESOURCE" ? "0" : priceRupees}
                    disabled={kind === "RESOURCE"}
                    icon={<CurrencyRupee fontSize="small" />}
                    onChange={(e) => setPriceRupees(e.target.value)}
                    placeholder={kind === "RESOURCE" ? "0" : "Enter course price"}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    {kind === "RESOURCE"
                      ? "Free resources are accessible to all learners for ₹0."
                      : hasValidPaidPrice
                        ? `Amount in INR: ${formatMoney(pricePaise, "INR")}`
                        : "Enter a price greater than ₹0."}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-semibold text-ink-700">
                      Course Thumbnail
                    </label>
                    <span className="text-xs text-slate-400">16:9 Aspect Ratio</span>
                  </div>

                  {/* Hidden File Input for click / replace */}
                  <input
                    ref={thumbnailInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/jpg"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void handleThumbnailFile(f);
                      e.target.value = "";
                    }}
                  />

                  {thumbnailUrl ? (
                    /* Thumbnail Preview State */
                    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-slate-900 shadow-sm transition hover:shadow-md">
                      <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={thumbnailUrl}
                          alt="Course thumbnail preview"
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

                        {/* Top badge */}
                        <div className="absolute top-2.5 left-2.5 flex items-center rounded-full bg-black/80 px-2.5 py-1 text-[11px] font-semibold text-white">
                          16:9 Thumbnail Ready
                        </div>

                        {/* Bottom Actions Bar */}
                        <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => thumbnailInputRef.current?.click()}
                              disabled={uploadingThumb}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-white hover:bg-paper-2 px-2.5 py-1.5 text-xs font-semibold text-ink-900 shadow-sm transition disabled:opacity-50"
                            >
                              <CloudUploadOutlined fontSize="small" />
                              Replace
                            </button>
                            <button
                              type="button"
                              onClick={() => setPickingMedia(true)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 hover:bg-ink-800 px-2.5 py-1.5 text-xs font-semibold text-white transition"
                            >
                              <Image fontSize="small" />
                              Library
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setThumbnailUrl("")}
                            className="inline-flex items-center gap-1 rounded-lg bg-rose-600/85 hover:bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition"
                            title="Remove thumbnail"
                          >
                            <DeleteOutlined fontSize="small" />
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Empty Upload Dropzone State */
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDraggingThumb(true);
                      }}
                      onDragLeave={() => setDraggingThumb(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDraggingThumb(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) void handleThumbnailFile(file);
                      }}
                      onClick={() => !uploadingThumb && thumbnailInputRef.current?.click()}
                      className={cn(
                        "group relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-colors",
                        draggingThumb
                          ? "border-brand-600 bg-brand-50/80 ring-4 ring-brand-100"
                          : "border-slate-300 bg-slate-50/60 hover:border-brand-500 hover:bg-brand-50/20",
                        uploadingThumb && "pointer-events-none opacity-70"
                      )}
                    >
                      {uploadingThumb ? (
                        <div className="flex flex-col items-center gap-2">
                          <span className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                          <p className="text-xs font-semibold text-brand-700">Uploading thumbnail…</p>
                        </div>
                      ) : (
                        <>
                          <div className="mb-2 grid h-12 w-12 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:scale-110 group-hover:bg-brand-100">
                            <CloudUploadOutlined fontSize="medium" />
                          </div>
                          <p className="text-xs font-semibold text-ink-800">
                            Drag & drop course thumbnail, or{" "}
                            <span className="text-brand-600 underline underline-offset-2">browse files</span>
                          </p>
                          <p className="mt-1 text-[11px] text-slate-400">
                            1280×720 (16:9) recommended · PNG, JPG, or WebP up to 5 MB
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  {/* Secondary options row: Media Library & Paste URL */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setPickingMedia(true)}
                      className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                    >
                      <Image fontSize="inherit" />
                      Browse media library
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowDirectUrlInput((prev) => !prev)}
                      className="text-slate-500 hover:text-ink-800 hover:underline"
                    >
                      {showDirectUrlInput ? "Hide URL input" : "or paste direct image URL"}
                    </button>
                  </div>

                  {showDirectUrlInput && (
                    <div className="pt-1">
                      <Input
                        type="url"
                        value={thumbnailUrl}
                        icon={<Image fontSize="small" />}
                        onChange={(e) => setThumbnailUrl(e.target.value)}
                        placeholder="Paste an image URL or choose from the media library"
                        className="text-xs"
                      />
                    </div>
                  )}

                  <MediaPicker
                    open={pickingMedia}
                    selected={[]}
                    onClose={() => setPickingMedia(false)}
                    onConfirm={(assets) => {
                      if (assets[0]) setThumbnailUrl(assets[0].url);
                      setPickingMedia(false);
                    }}
                  />
                </div>
              </div>
            </div>
          </Panel>

          <div className="flex justify-end gap-3">
            <Link href="/dashboard/admin/courses" className={buttonClass("ghost", "md")}>
              Cancel
            </Link>
            <Button
              type="button"
              disabled={!detailsValid}
              onClick={() => setStep(2)}
              className="gap-2"
            >
              <span>Next: Course Builder</span>
              <ArrowForward fontSize="small" />
            </Button>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* STEP 2 - BRANCH A: TUTORIALS & ARTICLES BUILDER              */}
      {/* ──────────────────────────────────────────────────────────── */}
      {step === 2 && kind === "RESOURCE" && (
        <div className="space-y-6">
          <AdminHeader
            title="Tutorials & Articles Builder"
            description="Organize your free resource into chapters and sub-lessons. Write markdown notes, embed diagrams/images, and format code walkthroughs."
          />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left Column: Sections & Sub-lessons Tree */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-ink-900 text-sm">Table of Contents</h3>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const newId = `sec-${Date.now()}`;
                    setSections([
                      ...sections,
                      {
                        id: newId,
                        title: `Section ${sections.length + 1}`,
                        summary: "",
                        subLessons: [
                          {
                            id: `sub-${Date.now()}`,
                            title: "Lesson 1",
                            summary: "",
                            content: "",
                          },
                        ],
                      },
                    ]);
                    setActiveSecId(newId);
                  }}
                  className="gap-1 text-xs"
                >
                  <Add sx={{ fontSize: 16 }} /> Section
                </Button>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {sections.map((sec, _secIdx) => (
                  <div key={sec.id} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <input
                        id={`resource-section-title-${sec.id}`}
                        type="text"
                        value={sec.title}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSections((prev) =>
                            prev.map((s) => (s.id === sec.id ? { ...s, title: val } : s)),
                          );
                        }}
                        aria-label={`Section ${_secIdx + 1} title`}
                        className="font-semibold text-xs text-ink-900 bg-transparent outline-none flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById(`resource-section-title-${sec.id}`)?.focus()}
                        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        aria-label={`Edit section ${_secIdx + 1} title`}
                        title="Edit section title"
                      >
                        <EditOutlined fontSize="small" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSections(sections.filter((s) => s.id !== sec.id));
                        }}
                        className="text-slate-400 hover:text-danger text-xs"
                        title="Remove section"
                      >
                        <DeleteOutlined sx={{ fontSize: 16 }} />
                      </button>
                    </div>

                    <div className="mt-2 space-y-1">
                      {sec.subLessons.map((sub) => {
                        const isSelected = activeSubLesson?.id === sub.id;
                        return (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              setActiveSecId(sec.id);
                              setActiveSubId(sub.id);
                            }}
                            className={cn(
                              "flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs font-medium transition",
                              isSelected
                                ? "bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200"
                                : "text-slate-600 hover:bg-slate-50",
                            )}
                          >
                            <span className="truncate">{sub.title}</span>
                          </button>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => {
                          const subId = `sub-${Date.now()}`;
                          setSections((prev) =>
                            prev.map((s) =>
                              s.id === sec.id
                                ? {
                                    ...s,
                                    subLessons: [
                                      ...s.subLessons,
                                      {
                                        id: subId,
                                        title: `Lesson ${s.subLessons.length + 1}`,
                                        summary: "",
                                        content: "",
                                      },
                                    ],
                                  }
                                : s,
                            ),
                          );
                          setActiveSecId(sec.id);
                          setActiveSubId(subId);
                        }}
                        className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition"
                      >
                        <Add sx={{ fontSize: 14 }} /> Add Sub-lesson
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Content Editor / Preview */}
            <div className="lg:col-span-8">
              {activeSubLesson ? (
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex-1 min-w-48">
                      <label className="text-xs font-semibold text-slate-500">
                        Sub-lesson article title
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          id={`resource-lesson-title-${activeSubLesson.id}`}
                          type="text"
                          value={activeSubLesson.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSections((prev) =>
                              prev.map((s) =>
                                s.id === activeSecId
                                  ? {
                                      ...s,
                                      subLessons: s.subLessons.map((sub) =>
                                        sub.id === activeSubLesson.id ? { ...sub, title: val } : sub,
                                      ),
                                    }
                                  : s,
                              ),
                            );
                          }}
                          className="w-full text-lg font-semibold text-ink-900 bg-transparent outline-none focus:underline"
                          placeholder="Sub-lesson title…"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById(`resource-lesson-title-${activeSubLesson.id}`)?.focus()}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                          aria-label="Edit sub-lesson title"
                          title="Edit sub-lesson title"
                        >
                          <EditOutlined fontSize="small" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setLivePreviewMode(false)}
                        className={cn(
                          "rounded-lg px-3 py-1 transition",
                          !livePreviewMode ? "bg-white text-ink-900 shadow-xs" : "text-slate-500",
                        )}
                      >
                        Editor
                      </button>
                      <button
                        type="button"
                        onClick={() => setLivePreviewMode(true)}
                        className={cn(
                          "rounded-lg px-3 py-1 transition",
                          livePreviewMode ? "bg-white text-emerald-700 shadow-xs" : "text-slate-500",
                        )}
                      >
                        Live Preview
                      </button>
                    </div>
                  </div>

                  {!livePreviewMode ? (
                    <div className="space-y-3">
                      {/* Markdown & Media Toolbar */}
                      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 pb-2 text-xs">
                        <span className="text-xs font-semibold text-slate-500 mr-1">
                          Insert:
                        </span>

                        {/* Image insertion buttons */}
                        <button
                          type="button"
                          disabled={uploadingArticleImage}
                          onClick={() => articleImageInputRef.current?.click()}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold border border-emerald-200 transition"
                        >
                          <Image sx={{ fontSize: 15 }} />
                          {uploadingArticleImage ? "Uploading..." : "+ Upload Image"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setPickingArticleMedia(true)}
                          className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-ink-700 font-medium transition"
                        >
                          + Media Library
                        </button>

                        <span className="h-4 w-px bg-slate-200 mx-1" />

                        {/* Code snippet buttons */}
                        <button
                          type="button"
                          onClick={() => {
                            const snippet = "\n```python\ndef format_titles(items):\n    return [item['title'].strip() for item in items if item['title'].strip()]\n```\n";
                            insertTextIntoActiveSubLesson(snippet);
                          }}
                          className="rounded-lg px-2 py-1 bg-slate-100 hover:bg-slate-200 text-ink-700 transition"
                        >
                          + Python Code
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const snippet = "\n```typescript\ninterface CourseOutline {\n  title: string;\n  lessons: string[];\n}\n\nconst outline: CourseOutline = {\n  title: \"Course title\",\n  lessons: [],\n};\n```\n";
                            insertTextIntoActiveSubLesson(snippet);
                          }}
                          className="rounded-lg px-2 py-1 bg-slate-100 hover:bg-slate-200 text-ink-700 transition"
                        >
                          + JS / TS Code
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const snippet = "\n```html\n<!-- Example HTML Structure -->\n<div class=\"card\">\n  <h3>Interactive Card</h3>\n  <button class=\"btn-primary\">Explore</button>\n</div>\n```\n";
                            insertTextIntoActiveSubLesson(snippet);
                          }}
                          className="rounded-lg px-2 py-1 bg-slate-100 hover:bg-slate-200 text-ink-700 transition"
                        >
                          + HTML Code
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const snippet = "\n> **Key takeaway:** Check edge cases and error states before deploying to production.\n";
                            insertTextIntoActiveSubLesson(snippet);
                          }}
                          className="rounded-lg px-2 py-1 bg-amber-50 text-amber-800 hover:bg-amber-100 font-medium transition"
                        >
                          + Callout Note
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const snippet = "\n### Section Heading\n\nExplain key concepts clearly here with step-by-step guidance.\n\n- Key requirement 1\n- Key requirement 2\n- Key requirement 3\n";
                            insertTextIntoActiveSubLesson(snippet);
                          }}
                          className="rounded-lg px-2 py-1 bg-slate-100 hover:bg-slate-200 text-ink-700 font-medium transition"
                        >
                          + Heading & List
                        </button>
                      </div>

                      <textarea
                        rows={16}
                        value={activeSubLesson.content}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSections((prev) =>
                            prev.map((s) =>
                              s.id === activeSecId
                                ? {
                                    ...s,
                                    subLessons: s.subLessons.map((sub) =>
                                      sub.id === activeSubLesson.id ? { ...sub, content: val } : sub,
                                    ),
                                  }
                                : s,
                            ),
                          );
                        }}
                        className="w-full font-mono text-sm leading-relaxed text-ink-900 bg-slate-50/50 rounded-xl p-4 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Write tutorial explanation, markdown, code samples, diagrams, and notes…"
                      />
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                        <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          Tutorial Article
                        </span>
                        <span className="text-xs text-slate-500">· Interactive Reader Preview</span>
                      </div>
                      <h2 className="text-2xl font-semibold text-ink-900 mb-4">{activeSubLesson.title}</h2>
                      <MarkdownArticleViewer content={activeSubLesson.content} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                  Select or add a sub-lesson to begin editing tutorial content.
                </div>
              )}

              {/* Hidden image file input for article upload */}
              <input
                ref={articleImageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  handleArticleImageFile(file);
                }}
              />

              {/* Media Picker modal for sub-lesson article images */}
              {pickingArticleMedia && (
                <MediaPicker
                  open
                  onClose={() => setPickingArticleMedia(false)}
                  onConfirm={(assets) => {
                    const asset = assets[0];
                    if (asset) insertTextIntoActiveSubLesson(`\n![${asset.alt || "Illustration"}](${asset.url})\n`);
                    setPickingArticleMedia(false);
                    notifySuccess("Image inserted from media library!");
                  }}
                />
              )}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
              <ArrowBack fontSize="small" /> Back to Details
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" loading={saving} onClick={() => handleFinalSubmit("DRAFT")}>
                Save as Draft
              </Button>
              <Button loading={saving} onClick={() => handleFinalSubmit("PUBLISHED")}>
                Publish Tutorial Resource
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────── */}
      {/* STEP 2 - BRANCH B: COURSE SYLLABUS & MILESTONE SKELETON     */}
      {/* ──────────────────────────────────────────────────────────── */}
      {step === 2 && kind === "PAID_COURSE" && (
        <div className="space-y-6">
          <AdminHeader
            title="Course Syllabus Builder (Milestones & Modules)"
            description="Structure the course syllabus into weekly modules and topic items. Mentors assigned to this course will upload the actual video lessons, assignments, and reading materials."
          />

          {/* Curriculum structure banner notice */}
          <div className="rounded-xl border border-brand-200 bg-brand-50/70 p-4 text-sm text-brand-900 flex items-start gap-3">
            <School className="text-brand-600 mt-0.5 shrink-0" fontSize="medium" />
            <div>
              <p className="font-semibold">Curriculum Structure & Skeleton Only</p>
              <p className="text-xs text-brand-800 mt-0.5">
                As the admin, you establish the learning path, modules, and topics. The actual inside materials (recordings, slides, project files) are crafted and uploaded by the mentors who teach this course.
              </p>
            </div>
          </div>

          {/* List of Weeks / Modules */}
          <div className="space-y-6">
            {modules.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-600 mb-3">
                  <School fontSize="large" />
                </div>
                <h3 className="font-display text-base font-semibold text-ink-900">No Weeks Added Yet</h3>
                <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
                  Start structuring your course syllabus manually. Add your first week module and define the milestone topics.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const newMod: CourseWeekModule = {
                      id: `mod-${Date.now()}`,
                      title: "Week 1",
                      summary: "",
                      items: [],
                    };
                    setModules([newMod]);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-700 transition"
                >
                  <Add fontSize="small" /> Add Week 1
                </button>
              </div>
            ) : (
              modules.map((mod, modIdx) => (
                <div
                  key={mod.id}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
                >
                  {/* Module Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex-1 min-w-64">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-brand-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                          Week {modIdx + 1}
                        </span>
                        <input
                          id={`course-week-title-${mod.id}`}
                          type="text"
                          value={mod.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setModules((prev) =>
                              prev.map((m) => (m.id === mod.id ? { ...m, title: val } : m)),
                            );
                          }}
                          className="text-base sm:text-lg font-semibold text-ink-900 bg-transparent outline-none flex-1 focus:underline"
                          placeholder="Week Module Title…"
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById(`course-week-title-${mod.id}`)?.focus()}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                          aria-label={`Edit week ${modIdx + 1} name`}
                          title="Edit week name"
                        >
                          <EditOutlined fontSize="small" />
                        </button>
                      </div>
                      <div className="mt-1.5 text-xs text-slate-500">
                        <span>{mod.items.length} learning milestones</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setModules(modules.filter((m) => m.id !== mod.id))}
                      className="text-slate-400 hover:text-danger text-xs font-semibold p-1"
                      title="Remove Week"
                    >
                      <DeleteOutlined fontSize="small" />
                    </button>
                  </div>

                  {/* Module Items (Skeleton Cards) */}
                  <div className="space-y-2.5">
                    {mod.items.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-5 text-center">
                        <p className="text-xs text-slate-400">
                          No learning milestones added to Week {modIdx + 1} yet. Click below to add a topic.
                        </p>
                      </div>
                    ) : (
                      mod.items.map((item, _itemIdx) => {
                        const typeConfig = {
                          VIDEO: { label: "Video Lecture", icon: <PlayCircle fontSize="small" className="text-rose-500" /> },
                      READING: { label: "Reading Notes", icon: <MenuBook fontSize="small" className="text-blue-500" /> },
                      ASSIGNMENT: { label: "Hands-on Project", icon: <Assignment fontSize="small" className="text-amber-500" /> },
                      QUIZ: { label: "Assessment Quiz", icon: <Quiz fontSize="small" className="text-purple-500" /> },
                      LIVE: { label: "Live Mentorship", icon: <Groups fontSize="small" className="text-emerald-500" /> },
                    }[item.type];

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition hover:bg-slate-50"
                      >
                        <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                          <span className="mt-0.5 sm:mt-0 shrink-0">{typeConfig.icon}</span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                {typeConfig.label}
                              </span>
                              <input
                                id={`course-milestone-title-${item.id}`}
                                type="text"
                                value={item.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setModules((prev) =>
                                    prev.map((m) =>
                                      m.id === mod.id
                                        ? {
                                            ...m,
                                            items: m.items.map((i) =>
                                              i.id === item.id ? { ...i, title: val } : i,
                                            ),
                                          }
                                        : m,
                                    ),
                                  );
                                }}
                                className="font-semibold text-sm text-ink-900 bg-transparent outline-none flex-1 min-w-36 focus:underline"
                                placeholder="Topic / Item title…"
                              />
                              <button
                                type="button"
                                onClick={() => document.getElementById(`course-milestone-title-${item.id}`)?.focus()}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-white hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                                aria-label="Edit milestone title"
                                title="Edit milestone title"
                              >
                                <EditOutlined fontSize="small" />
                              </button>
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              <input
                                id={`course-mentor-note-${item.id}`}
                                type="text"
                                value={item.mentorNotes}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setModules((prev) =>
                                    prev.map((m) =>
                                      m.id === mod.id
                                        ? {
                                            ...m,
                                            items: m.items.map((i) =>
                                              i.id === item.id ? { ...i, mentorNotes: val } : i,
                                            ),
                                          }
                                        : m,
                                    ),
                                  );
                                }}
                                className="w-full text-xs text-slate-500 bg-transparent outline-none focus:text-slate-800"
                                placeholder="Note for Mentor: e.g. Mentor records walkthrough with demo code"
                              />
                              <button
                                type="button"
                                onClick={() => document.getElementById(`course-mentor-note-${item.id}`)?.focus()}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-white hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                                aria-label="Edit mentor note"
                                title="Edit mentor note"
                              >
                                <EditOutlined fontSize="small" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                          <select
                            value={item.type}
                            onChange={(e) => {
                              const val = e.target.value as CourseMilestoneItem["type"];
                              setModules((prev) =>
                                prev.map((m) =>
                                  m.id === mod.id
                                    ? {
                                        ...m,
                                        items: m.items.map((i) =>
                                          i.id === item.id
                                            ? {
                                                ...i,
                                                type: val,
                                                duration:
                                                  val === "VIDEO" || val === "READING"
                                                    ? ""
                                                    : i.duration,
                                              }
                                            : i,
                                        ),
                                      }
                                    : m,
                                ),
                              );
                            }}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none"
                          >
                            <option value="VIDEO">Video</option>
                            <option value="READING">Reading</option>
                            <option value="ASSIGNMENT">Project</option>
                            <option value="QUIZ">Quiz</option>
                            <option value="LIVE">Live Session</option>
                          </select>

                          {item.type !== "VIDEO" && item.type !== "READING" && (
                            <input
                              type="text"
                              value={item.duration}
                              onChange={(e) => {
                                const val = e.target.value;
                                setModules((prev) =>
                                  prev.map((m) =>
                                    m.id === mod.id
                                      ? {
                                          ...m,
                                          items: m.items.map((i) =>
                                            i.id === item.id ? { ...i, duration: val } : i,
                                          ),
                                        }
                                      : m,
                                  ),
                                );
                              }}
                              className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1 text-center text-xs font-semibold text-slate-700 outline-none"
                              placeholder="Duration"
                              aria-label={`${item.type.toLowerCase()} duration`}
                            />
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setModules((prev) =>
                                prev.map((m) =>
                                  m.id === mod.id
                                    ? { ...m, items: m.items.filter((i) => i.id !== item.id) }
                                    : m,
                                ),
                              );
                            }}
                            className="text-slate-400 hover:text-danger p-1"
                            title="Delete topic"
                          >
                            <DeleteOutlined sx={{ fontSize: 16 }} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}

                <button
                  type="button"
                  onClick={() => {
                    const newItem: CourseMilestoneItem = {
                      id: `item-${Date.now()}-${mod.items.length + 1}`,
                      title: "",
                      type: "VIDEO",
                      duration: "",
                      mentorNotes: "",
                    };
                    setModules((prev) =>
                      prev.map((m) =>
                        m.id === mod.id ? { ...m, items: [...m.items, newItem] } : m,
                      ),
                    );
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 py-2.5 text-xs font-semibold text-brand-700 hover:bg-brand-50 hover:border-brand-400 transition"
                >
                  <Add sx={{ fontSize: 16 }} /> Add item to week {modIdx + 1}
                </button>
              </div>
            </div>
          ))
        )}

            {modules.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const newMod: CourseWeekModule = {
                    id: `mod-${Date.now()}`,
                    title: `Week ${modules.length + 1}`,
                    summary: "",
                    items: [],
                  };
                  setModules([...modules, newMod]);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 p-4 text-sm font-semibold text-slate-700 hover:border-brand-500 hover:text-brand-700 hover:bg-white transition"
              >
              <Add fontSize="small" /> Add week
              </button>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-200">
            <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
              <ArrowBack fontSize="small" /> Back to Course Details
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" loading={saving} onClick={() => handleFinalSubmit("DRAFT")}>
                Save as Draft
              </Button>
              <Button loading={saving} onClick={() => handleFinalSubmit("PUBLISHED")}>
                Publish Paid Course
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
