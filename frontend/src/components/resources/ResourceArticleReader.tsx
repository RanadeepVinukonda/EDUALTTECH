"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BookmarkBorder from "@mui/icons-material/BookmarkBorder";
import Bookmark from "@mui/icons-material/Bookmark";
import Share from "@mui/icons-material/Share";
import Check from "@mui/icons-material/Check";
import AccessTime from "@mui/icons-material/AccessTime";
import Visibility from "@mui/icons-material/Visibility";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Lightbulb from "@mui/icons-material/Lightbulb";
import Psychology from "@mui/icons-material/Psychology";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Explore from "@mui/icons-material/Explore";
import WorkspacePremium from "@mui/icons-material/WorkspacePremium";
import LibraryBooks from "@mui/icons-material/LibraryBooks";
import type { ResourceArticleDetail } from "@/lib/types";
import { cn } from "@/lib/cn";
import { apiPost, ApiError } from "@/lib/api";
import MarkdownArticleViewer from "@/components/ui/MarkdownArticleViewer";
import LinkButton from "@/components/ui/LinkButton";

interface Props {
  article: ResourceArticleDetail;
}

interface ParsedSection {
  id: string;
  title: string;
  body: string;
  kind: "learn" | "idea" | "try" | "check" | "mindful" | "default";
}

function slugifyHeading(raw: string): string {
  return raw
    .replace(/[*`_]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

function classifySection(title: string): ParsedSection["kind"] {
  const lower = title.toLowerCase();
  if (lower.includes("what you will learn") || lower.includes("what you'll learn")) return "learn";
  if (lower.includes("key idea") || lower.includes("core concept")) return "idea";
  if (lower.startsWith("try it") || lower.includes("hands-on") || lower.includes("practice")) return "try";
  if (lower.includes("check your understanding") || lower.includes("quiz") || lower.includes("reflect")) return "check";
  if (lower.includes("keep learning") || lower.includes("thoughtfully") || lower.includes("safety")) return "mindful";
  return "default";
}

function stripDuplicateTitle(markdown: string, title: string): string {
  const lines = markdown.split(/\r?\n/);
  const firstNonEmpty = lines.findIndex((l) => l.trim().length > 0);
  if (firstNonEmpty === -1) return markdown;
  const line = lines[firstNonEmpty].trim();
  if (line.startsWith("# ")) {
    const h1Text = line.slice(2).replace(/[*`_]/g, "").trim().toLowerCase();
    if (h1Text === title.trim().toLowerCase()) {
      return lines.slice(firstNonEmpty + 1).join("\n").trim();
    }
  }
  return markdown.trim();
}

function parseSections(markdown: string): { intro: string; sections: ParsedSection[] } {
  const lines = markdown.split(/\r?\n/);
  const introLines: string[] = [];
  const sections: ParsedSection[] = [];
  let current: { title: string; lines: string[] } | null = null;
  let inCodeFence = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("```")) {
      inCodeFence = !inCodeFence;
    }

    if (!inCodeFence && trimmed.startsWith("## ")) {
      if (current) {
        const cleanTitle = current.title.replace(/[*`_]/g, "").trim();
        sections.push({
          id: slugifyHeading(cleanTitle),
          title: cleanTitle,
          body: current.lines.join("\n").trim(),
          kind: classifySection(cleanTitle),
        });
      }
      current = { title: trimmed.slice(3).trim(), lines: [] };
    } else if (current) {
      current.lines.push(line);
    } else {
      introLines.push(line);
    }
  }

  if (current) {
    const cleanTitle = current.title.replace(/[*`_]/g, "").trim();
    sections.push({
      id: slugifyHeading(cleanTitle),
      title: cleanTitle,
      body: current.lines.join("\n").trim(),
      kind: classifySection(cleanTitle),
    });
  }

  return { intro: introLines.join("\n").trim(), sections };
}

function sectionMeta(kind: ParsedSection["kind"]) {
  switch (kind) {
    case "learn":
      return {
        eyebrow: "Learning Goal",
        Icon: Explore,
        cardClass: "border-brand-200/90 bg-[#ffffff] border-l-4 border-l-[#025926]",
        iconClass: "border-brand-200 bg-brand-50 text-[#025926]",
      };
    case "idea":
      return {
        eyebrow: "Core Concept",
        Icon: Lightbulb,
        cardClass: "border-rule bg-[#ffffff]",
        iconClass: "border-amber-200 bg-amber-50 text-amber-800",
      };
    case "try":
      return {
        eyebrow: "Hands-On Activity",
        Icon: Psychology,
        cardClass: "border-brand-300 bg-brand-50/55",
        iconClass: "border-[#025926] bg-[#025926] text-white",
      };
    case "check":
      return {
        eyebrow: "Quick Reflection",
        Icon: CheckCircle,
        cardClass: "border-ink-200/90 bg-[#ffffff]",
        iconClass: "border-ink-200 bg-ink-100/70 text-[#024059]",
      };
    case "mindful":
      return {
        eyebrow: "Mindful Learning",
        Icon: WorkspacePremium,
        cardClass: "border-amber-200/90 bg-amber-50/45",
        iconClass: "border-amber-200 bg-[#ffffff] text-amber-800",
      };
    default:
      return {
        eyebrow: "Section",
        Icon: LibraryBooks,
        cardClass: "border-rule bg-[#ffffff]",
        iconClass: "border-rule bg-paper-2 text-ink-2",
      };
  }
}

export default function ResourceArticleReader({ article }: Props) {
  const [isBookmarked, setIsBookmarked] = useState(article.isBookmarked ?? false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ text: string; loginHref?: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState<string>("");
  const [triedActivity, setTriedActivity] = useState(false);
  const [completedLesson, setCompletedLesson] = useState(false);
  const [reflectionNote, setReflectionNote] = useState("");

  const cleanedContent = useMemo(
    () => stripDuplicateTitle(article.content, article.title),
    [article.content, article.title],
  );
  const { intro, sections } = useMemo(() => parseSections(cleanedContent), [cleanedContent]);

  // Restore local interactive progress (activity check, reflection note, completion)
  useEffect(() => {
    try {
      const key = `edu:tutorial:${article.slug}`;
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          tried?: boolean;
          completed?: boolean;
          note?: string;
        };
        setTriedActivity(Boolean(parsed.tried));
        setCompletedLesson(Boolean(parsed.completed));
        setReflectionNote(parsed.note ?? "");
      } else {
        setTriedActivity(false);
        setCompletedLesson(false);
        setReflectionNote("");
      }
    } catch {
      // ignore storage errors
    }
  }, [article.slug]);

  function persistLocal(next: { tried?: boolean; completed?: boolean; note?: string }) {
    try {
      const key = `edu:tutorial:${article.slug}`;
      window.localStorage.setItem(
        key,
        JSON.stringify({
          tried: next.tried ?? triedActivity,
          completed: next.completed ?? completedLesson,
          note: next.note ?? reflectionNote,
        }),
      );
    } catch {
      // ignore storage errors
    }
  }

  // Reading progress bar + active TOC scroll spy
  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? Math.min(100, Math.max(0, (window.scrollY / scrollable) * 100)) : 0;
      setScrollPct(pct);

      if (sections.length > 0) {
        let current = sections[0].id;
        for (const sec of sections) {
          const el = document.getElementById(sec.id);
          if (el && el.getBoundingClientRect().top <= 160) {
            current = sec.id;
          }
        }
        setActiveSectionId(current);
      }
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  async function handleToggleBookmark() {
    if (bookmarkLoading) return;
    setBookmarkLoading(true);
    setActionNotice(null);
    const prev = isBookmarked;
    setIsBookmarked(!prev);
    try {
      const res = await apiPost<{ bookmarked: boolean }>(`/resources/article/${article.id}/bookmark`);
      setIsBookmarked(res.bookmarked);
      setActionNotice({ text: res.bookmarked ? "Saved to your bookmarks." : "Removed from bookmarks." });
      setTimeout(() => setActionNotice(null), 2600);
    } catch (err) {
      setIsBookmarked(prev);
      if (err instanceof ApiError && err.status === 401) {
        setActionNotice({
          text: "Sign in to save tutorials to your account.",
          loginHref: `/login?next=${encodeURIComponent(`/resources/${article.slug}`)}`,
        });
      } else {
        setActionNotice({ text: "Could not save right now. Please try again." });
      }
    } finally {
      setBookmarkLoading(false);
    }
  }

  async function handleShare() {
    if (typeof window === "undefined") return;
    const url = window.location.href;
    let didCopy = false;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        didCopy = true;
      }
    } catch {
      didCopy = false;
    }

    if (!didCopy) {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = url;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        didCopy = document.execCommand("copy");
        document.body.removeChild(textarea);
      } catch {
        didCopy = false;
      }
    }

    if (didCopy) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } else {
      setActionNotice({ text: `Copy link: ${url}` });
    }
  }

  const updatedDate = new Date(article.updatedAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-paper pb-20">
      {/* Live Reading Progress Bar */}
      <div
        aria-hidden="true"
        className="fixed left-0 right-0 top-16 z-30 h-[3px] bg-brand-100/70"
      >
        <div
          className="h-full bg-[#038c3e] transition-[width] duration-150 ease-out"
          style={{ width: `${scrollPct}%` }}
        />
      </div>

      {/* Solid Logo-Green Editorial Tutorial Header */}
      <header className="border-b border-[#02481f] bg-[#025926] text-white">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pb-12 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/80 sm:text-sm">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-white/55">
                <ChevronRight fontSize="small" />
              </li>
              <li>
                <Link href="/resources" className="transition-colors hover:text-white">
                  Resources
                </Link>
              </li>
              {article.category && (
                <>
                  <li aria-hidden className="text-white/55">
                    <ChevronRight fontSize="small" />
                  </li>
                  <li>
                    <Link
                      href={`/resources#${article.category.slug}`}
                      className="transition-colors hover:text-white"
                    >
                      {article.category.name}
                    </Link>
                  </li>
                </>
              )}
              {article.subcategory && (
                <>
                  <li aria-hidden className="text-white/55">
                    <ChevronRight fontSize="small" />
                  </li>
                  <li className="font-medium text-white">{article.subcategory.name}</li>
                </>
              )}
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-[#024059] px-3 py-1 text-xs font-semibold text-white">
              {article.subcategory?.name || article.category?.name || "Free Tutorial"}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-white">
              <AccessTime sx={{ fontSize: 13 }} aria-hidden />
              {article.estimatedMinutes} min read
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-white">
              <Visibility sx={{ fontSize: 13 }} aria-hidden />
              {article.views.toLocaleString()} reads
            </span>
            {completedLesson && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#ffffff] px-3 py-1 text-xs font-semibold text-[#025926]">
                <CheckCircle sx={{ fontSize: 14 }} aria-hidden />
                Completed
              </span>
            )}
          </div>

          <h1 className="mt-4 max-w-4xl font-display text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            {article.title}
          </h1>

          {article.description && (
            <p className="mt-3.5 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
              {article.description}
            </p>
          )}

          {/* Author + Save / Share Actions */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-5">
            <div className="flex flex-wrap items-center gap-2 text-xs text-white/85 sm:text-sm">
              <span className="font-semibold text-white">
                {article.authorAttribution || "EduAltTech Academic Team"}
              </span>
              <span aria-hidden>·</span>
              <span>Updated {updatedDate}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleToggleBookmark}
                disabled={bookmarkLoading}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition",
                  isBookmarked
                    ? "border-white bg-[#ffffff] text-[#025926]"
                    : "border-white/30 bg-white/15 text-white hover:bg-white/25",
                )}
                aria-label={isBookmarked ? "Remove bookmark" : "Bookmark tutorial"}
              >
                {isBookmarked ? <Bookmark sx={{ fontSize: 16 }} /> : <BookmarkBorder sx={{ fontSize: 16 }} />}
                <span>{isBookmarked ? "Saved" : "Save"}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-white/30 bg-white/15 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-white/25"
                aria-label="Share tutorial link"
              >
                {copied ? (
                  <>
                    <Check sx={{ fontSize: 16 }} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share sx={{ fontSize: 16 }} />
                    <span>Share</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {actionNotice && (
            <div
              role="status"
              aria-live="polite"
              className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/30 bg-[#ffffff] px-4 py-2.5 text-xs font-medium text-ink shadow-elev1"
            >
              <span>{actionNotice.text}</span>
              {actionNotice.loginHref && (
                <Link
                  href={actionNotice.loginHref}
                  className="font-semibold text-[#025926] underline underline-offset-2 hover:text-brand-800"
                >
                  Sign in →
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content + Sticky Interactive Sidebar */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_290px] lg:items-start lg:gap-12">
          <main className="min-w-0 space-y-6">
            {intro && (
              <div className="rounded-2xl border border-rule bg-[#ffffff] p-6 shadow-elev1 sm:p-8">
                <MarkdownArticleViewer content={intro} />
              </div>
            )}

            {sections.length > 0 ? (
              sections.map((section, idx) => {
                const { eyebrow, Icon, cardClass, iconClass } = sectionMeta(section.kind);
                return (
                  <section
                    key={`${section.id}-${idx}`}
                    id={section.id}
                    aria-labelledby={`heading-${section.id}`}
                    className={cn(
                      "scroll-mt-24 overflow-hidden rounded-2xl border p-6 shadow-elev1 sm:p-7",
                      cardClass,
                    )}
                    style={
                      section.kind === "try"
                        ? {
                            backgroundImage:
                              "radial-gradient(circle, rgba(2, 89, 38, 0.08) 1px, transparent 1px)",
                            backgroundSize: "18px 18px",
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-start gap-3.5">
                      <span
                        className={cn(
                          "mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                          iconClass,
                        )}
                      >
                        <Icon fontSize="small" aria-hidden />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                          {eyebrow}
                        </p>
                        <h2
                          id={`heading-${section.id}`}
                          className="mt-0.5 font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl"
                        >
                          {section.title}
                        </h2>
                      </div>
                    </div>

                    <div className="mt-4">
                      <MarkdownArticleViewer content={section.body} />
                    </div>

                    {/* Interactive Activity Completion Toggle for "Try it" */}
                    {section.kind === "try" && (
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-brand-200/80 pt-4">
                        <span className="text-xs font-medium text-ink-2">
                          {triedActivity
                            ? "Awesome work! Hands-on practice makes concepts stick."
                            : "Try this activity on paper or in your notebook, then mark it done."}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const next = !triedActivity;
                            setTriedActivity(next);
                            persistLocal({ tried: next });
                          }}
                          className={cn(
                            "inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-semibold transition",
                            triedActivity
                              ? "border-[#025926] bg-[#025926] text-white"
                              : "border-brand-300 bg-[#ffffff] text-[#025926] hover:bg-brand-50",
                          )}
                        >
                          <CheckCircle sx={{ fontSize: 15 }} aria-hidden />
                          <span>{triedActivity ? "Activity Completed" : "I tried this!"}</span>
                        </button>
                      </div>
                    )}

                    {/* Interactive Reflection Scratchpad for "Check your understanding" */}
                    {section.kind === "check" && (
                      <div className="mt-5 border-t border-rule pt-4">
                        <label
                          htmlFor={`reflection-${section.id}`}
                          className="block font-mono text-[11px] font-semibold uppercase tracking-wider text-muted"
                        >
                          Your Reflection Note (saved in your browser)
                        </label>
                        <textarea
                          id={`reflection-${section.id}`}
                          rows={3}
                          value={reflectionNote}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReflectionNote(val);
                            persistLocal({ note: val });
                          }}
                          placeholder="Jot down your thoughts or answer here…"
                          className="mt-2 w-full rounded-xl border border-rule bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-muted focus-visible:border-[#025926] focus-visible:bg-[#ffffff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#025926]/20"
                        />
                      </div>
                    )}
                  </section>
                );
              })
            ) : (
              <div className="rounded-2xl border border-rule bg-[#ffffff] p-6 shadow-elev1 sm:p-8">
                <MarkdownArticleViewer content={cleanedContent} />
              </div>
            )}

            {/* Complete Lesson Banner + Tags */}
            <div className="rounded-2xl border border-rule bg-[#ffffff] p-6 shadow-elev1">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold text-ink">
                    {completedLesson ? "Tutorial marked as complete!" : "Finished reading this guide?"}
                  </h3>
                  <p className="mt-1 text-xs text-ink-2">
                    Track your personal progress across EduAltTech&apos;s free learning library.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !completedLesson;
                    setCompletedLesson(next);
                    persistLocal({ completed: next });
                  }}
                  className={cn(
                    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-semibold transition",
                    completedLesson
                      ? "border-[#025926] bg-[#025926] text-white"
                      : "border-brand-300 bg-brand-50 text-[#025926] hover:bg-brand-100",
                  )}
                >
                  <CheckCircle sx={{ fontSize: 16 }} aria-hidden />
                  <span>{completedLesson ? "Completed" : "Mark tutorial complete"}</span>
                </button>
              </div>

              {article.tags.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-rule pt-4">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted">
                    Related topics:
                  </span>
                  {article.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/resources?q=${encodeURIComponent(tag)}`}
                      className="rounded-full border border-rule bg-paper-2 px-3 py-1 text-xs font-medium text-ink-2 transition hover:border-brand-300 hover:bg-brand-50 hover:text-[#025926]"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Ecosystem Bridge: Resource -> Structured Course */}
            {article.linkedCourse && (
              <div className="rounded-2xl border border-brand-200 bg-brand-50/70 p-6 shadow-elev1 sm:p-8">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-700">
                  Go Deeper With a Mentor
                </p>
                <h3 className="mt-1.5 font-display text-xl font-semibold text-ink">
                  Continue with {article.linkedCourse.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">
                  {article.linkedCourse.description ||
                    "Master this topic with direct mentor guidance, structured projects, and an MSME Approved certificate."}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-4">
                  <LinkButton href={`/courses/${article.linkedCourse.slug}`} variant="primary">
                    View Complete Course &amp; Syllabus
                  </LinkButton>
                  <span className="text-xs text-muted">
                    Includes live mentor sessions &amp; project reviews
                  </span>
                </div>
              </div>
            )}

            {/* Next / Previous Navigation Cards */}
            <nav aria-label="Tutorial pagination" className="grid gap-4 pt-2 sm:grid-cols-2">
              {article.prevArticle ? (
                <Link
                  href={`/resources/${article.prevArticle.slug}`}
                  className="group flex flex-col rounded-2xl border border-rule bg-[#ffffff] p-5 shadow-elev1 transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-elev2"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted group-hover:text-[#025926]">
                    <ArrowBack sx={{ fontSize: 15 }} aria-hidden className="transition-transform group-hover:-translate-x-0.5" />
                    Previous Tutorial
                  </span>
                  <span className="mt-2 font-display text-base font-semibold text-ink group-hover:text-[#025926]">
                    {article.prevArticle.title}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/resources"
                  className="group flex flex-col justify-center rounded-2xl border border-rule bg-[#ffffff] p-5 shadow-elev1 transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-elev2"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted group-hover:text-[#025926]">
                    <ArrowBack sx={{ fontSize: 15 }} aria-hidden />
                    Back to Library
                  </span>
                  <span className="mt-1 font-display text-base font-semibold text-ink">
                    Browse all tutorials
                  </span>
                </Link>
              )}

              {article.nextArticle && (
                <Link
                  href={`/resources/${article.nextArticle.slug}`}
                  className="group flex flex-col items-end rounded-2xl border border-rule bg-[#ffffff] p-5 text-right shadow-elev1 transition-all hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-elev2"
                >
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted group-hover:text-[#025926]">
                    Next Tutorial
                    <ArrowForward sx={{ fontSize: 15 }} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="mt-2 font-display text-base font-semibold text-ink group-hover:text-[#025926]">
                    {article.nextArticle.title}
                  </span>
                </Link>
              )}
            </nav>
          </main>

          {/* Sticky Sidebar: Active Scroll-Spy TOC & Knowledge Base Card */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-5">
              {sections.length > 0 && (
                <div className="rounded-2xl border border-rule bg-[#ffffff] p-5 shadow-elev1">
                  <div className="flex items-center justify-between">
                    <h2 className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                      On this page
                    </h2>
                    <span className="font-mono text-[11px] font-semibold text-brand-700">
                      {Math.round(scrollPct)}%
                    </span>
                  </div>
                  <nav className="mt-3.5 space-y-1" aria-label="Table of contents">
                    {sections.map((sec, idx) => {
                      const isActive = activeSectionId === sec.id;
                      return (
                        <a
                          key={`${sec.id}-${idx}`}
                          href={`#${sec.id}`}
                          className={cn(
                            "block rounded-lg border-l-2 px-3 py-1.5 text-xs leading-relaxed transition-colors",
                            isActive
                              ? "border-[#025926] bg-brand-50 font-semibold text-[#025926]"
                              : "border-transparent text-ink-2 hover:bg-paper-2 hover:text-ink",
                          )}
                        >
                          {sec.title}
                        </a>
                      );
                    })}
                  </nav>
                </div>
              )}

              <div className="overflow-hidden rounded-2xl border border-rule bg-[#ffffff] shadow-elev1">
                <div className="p-5">
                  <h3 className="font-display text-sm font-semibold text-ink">
                    EduAltTech Knowledge Base
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-ink-2">
                    Open-access guides created by practitioners and faculty. Self-paced and free forever.
                  </p>
                  <div className="mt-4 flex flex-col gap-2">
                    <Link
                      href="/resources"
                      className="block rounded-xl bg-paper-2 py-2.5 text-center text-xs font-semibold text-ink transition hover:bg-paper-3"
                    >
                      Explore All Topics
                    </Link>
                    <Link
                      href="/courses"
                      className="block rounded-xl bg-[#025926] py-2.5 text-center text-xs font-semibold text-white transition hover:bg-brand-800"
                    >
                      Browse Mentored Courses
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
