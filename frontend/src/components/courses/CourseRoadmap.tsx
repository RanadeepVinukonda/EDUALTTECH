"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

export interface RoadmapProgress {
  completedLessonIds: string[];
  totalLessons: number;
  pct: number;
}

export interface RoadmapLesson {
  id: string;
  title: string;
  type: "VIDEO" | "READING" | "QUIZ" | "ASSIGNMENT";
  resources?: Array<{ label: string; url: string }>;
  // Absent in the pre-enrollment teaser payload — titles only.
  contentUrl?: string | null;
  meetingUrl?: string | null;
  textContent?: string | null;
  position: number;
  isPublished?: boolean;
}

export interface RoadmapModule {
  id: string;
  title: string;
  position: number;
  resources?: Array<{ label: string; url: string }>;
  lessons: RoadmapLesson[];
}

export interface RoadmapChapter {
  id: string;
  title: string;
  summary: string | null;
  order: number;
  recordingUrl: string | null;
  meetingUrl: string | null;
  modules: RoadmapModule[];
  resources: Array<{ url: string; label: string }>;
}

/** The roadmap itself: created first, then chapters hang off it. */
export interface RoadmapShell {
  title: string | null;
  summary: string | null;
  meetingUrl: string | null;
  recordingUrl: string | null;
  resources: Array<{ label: string; url: string }> | null;
}

export interface RoadmapMeeting {
  id: string;
  title: string;
  meetingUrl: string;
  scheduledAt: string;
  chapter: { id: string } | null;
}

const inputShell =
  "flex h-[50px] w-full items-center rounded-[10px] border-[1.5px] border-slate-200 bg-white px-3 transition focus-within:border-brand-500";
const inputCls = "ml-2 h-full w-full min-w-0 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400";
const areaCls =
  "w-full rounded-[10px] border-[1.5px] border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 placeholder:text-slate-400";
const labelCls = "mb-1 block text-sm font-semibold text-slate-800";
const submitCls =
  "rounded-[10px] bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-50";

const LESSON_TYPES = [
  { value: "VIDEO", label: "Recorded class" },
  { value: "READING", label: "Reading / notes" },
  { value: "QUIZ", label: "Quiz" },
  { value: "ASSIGNMENT", label: "Assignment" },
];

const TYPE_DOT: Record<RoadmapLesson["type"], string> = {
  VIDEO: "bg-sky-500",
  READING: "bg-slate-400",
  QUIZ: "bg-violet-500",
  ASSIGNMENT: "bg-brand-600",
};

/** "label|url, label|url" ⇄ [{ label, url }] — one shape for chapter, lesson and concept. */
function parseResources(raw: string): Array<{ label: string; url: string }> {
  return raw
    .split(",")
    .map((pair) => pair.split("|").map((s) => s.trim()))
    .filter(([label, url]) => label && url && /^https?:\/\//.test(url))
    .map(([label, url]) => ({ label: label!, url: url! }));
}

function formatResources(list?: Array<{ label: string; url: string }>): string {
  return (list ?? []).map((r) => `${r.label}|${r.url}`).join(", ");
}

function ResourceStrip({ resources }: { resources?: Array<{ label: string; url: string }> }) {
  if (!resources || resources.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {resources.map((r) => (
        <li key={r.url}>
          <Link href={r.url} target="_blank" rel="noopener noreferrer" className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">
            {r.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function typeLabel(type: RoadmapLesson["type"]): string {
  return LESSON_TYPES.find((t) => t.value === type)?.label ?? type;
}

/**
 * The course path. One component, two modes:
 *  - "mentor": full authoring — + chapter, + concept, + lesson, inline editors.
 *  - "learn":   read-only path — watch recordings, join meetings, open resources.
 * `locked` is the pre-enrollment teaser: titles only, no links.
 */
export default function CourseRoadmap({
  courseId,
  chapters,
  roadmap,
  meetings = [],
  initialProgress,
  mode,
  locked = false,
  onChanged,
}: {
  courseId: string;
  chapters: RoadmapChapter[];
  roadmap?: RoadmapShell | null;
  meetings?: RoadmapMeeting[];
  initialProgress?: RoadmapProgress;
  /** admin = owns the structure, mentor = fills content inside concepts, learn = read only. */
  mode: "admin" | "mentor" | "learn";
  locked?: boolean;
  onChanged?: () => void;
}) {
  const mentor = mode === "mentor" && !locked;
  /** The roadmap shell and the chapter list are the admin's alone. */
  const canStructure = mode === "admin" && !locked;
  /** Lessons sit inside admin chapters: mentors build them too. */
  const canLessons = (mode === "admin" || mode === "mentor") && !locked;
  /** Concepts and their content are the mentor's job. */
  const canConcepts = (mode === "admin" || mode === "mentor") && !locked;
  const [openChapter, setOpenChapter] = useState<string | null>(null);
  const [openModule, setOpenModule] = useState<string | null>(null);
  const [editLesson, setEditLesson] = useState<string | null>(null);
  const [editChapter, setEditChapter] = useState<string | null>(null);
  const [completed, setCompleted] = useState<string[]>(initialProgress?.completedLessonIds ?? []);
  const [busyLesson, setBusyLesson] = useState<string | null>(null);

  async function complete(lessonId: string) {
    setBusyLesson(lessonId);
    setCompleted((list) => [...list, lessonId]);
    try {
      await api(`/courses/lessons/${lessonId}/complete`, { method: "POST" });
      onChanged?.();
    } catch {
      setCompleted((list) => list.filter((id) => id !== lessonId));
    } finally {
      setBusyLesson(null);
    }
  }

  const total = initialProgress?.totalLessons ?? 0;
  const pct = total === 0 ? 0 : Math.round((completed.length / total) * 100);

  if (!mentor) {
    return (
      <>
        {roadmap?.title && (
          <header className="mt-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
            <h3 className="font-display text-lg font-semibold text-slate-900">{roadmap.title}</h3>
            {roadmap.summary && <p className="mt-1 text-sm text-slate-600">{roadmap.summary}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {roadmap.meetingUrl && <Link href={roadmap.meetingUrl} target="_blank" rel="noopener noreferrer" className="rounded-[10px] bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800">Join live class</Link>}
              {roadmap.recordingUrl && <Link href={roadmap.recordingUrl} target="_blank" rel="noopener noreferrer" className="rounded-[10px] border border-[1.5px] border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50">Watch recording</Link>}
            </div>
            <ResourceStrip resources={roadmap.resources ?? []} />
            {total > 0 && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>Your progress</span>
                  <span>{pct}% · {completed.length}/{total} concepts</span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )}
          </header>
        )}
      <ol className="mt-4 space-y-3">
        {chapters.length === 0 && <EmptyRoadmap canStructure={false} />}
        {chapters.map((c) => (
          <ChapterNode
            key={c.id}
            chapter={c}
            meetings={meetings.filter((m) => m.chapter?.id === c.id)}
            open={openChapter === c.id}
            locked={locked}
            onToggle={() => setOpenChapter((o) => (o === c.id ? null : c.id))}
            openModule={openModule}
            onToggleModule={(id) => setOpenModule((o) => (o === id ? null : id))}
            mode={mode}
            completed={completed}
            busyLesson={busyLesson}
            onComplete={(id) => void complete(id)}
          />
        ))}
      </ol>
      </>
    );
  }

  return (
    <>
      {canStructure ? (
        <RoadmapShellForm courseId={courseId} roadmap={roadmap ?? null} onDone={() => onChanged?.()} />
      ) : (
        roadmap?.title && (
          <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Course roadmap</p>
            <h3 className="font-display text-lg font-semibold text-slate-900">{roadmap.title}</h3>
            {roadmap.summary && <p className="mt-1 text-sm text-slate-600">{roadmap.summary}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {roadmap.meetingUrl && <Link href={roadmap.meetingUrl} target="_blank" rel="noopener noreferrer" className="rounded-[10px] bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800">Join live class</Link>}
              {roadmap.recordingUrl && <Link href={roadmap.recordingUrl} target="_blank" rel="noopener noreferrer" className="rounded-[10px] border border-[1.5px] border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50">Watch recording</Link>}
            </div>
            <ResourceStrip resources={roadmap.resources ?? []} />
            <p className="mt-3 text-xs text-slate-500">Chapters and lessons are set by the course admin — open a lesson to add your concepts, links and resources.</p>
          </div>
        )
      )}
      <p className="mt-6 mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Chapters</p>
      <ol className="mt-2 space-y-3">
      {chapters.length === 0 && <EmptyRoadmap canStructure={canStructure} />}
      {chapters.map((c) => (
        <li key={c.id} className="relative">
          <div className="flex items-start gap-3">
            <Node tone="brand" />
            <div className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white">
              <button
                type="button"
                onClick={() => setOpenChapter((o) => (o === c.id ? null : c.id))}
                aria-expanded={openChapter === c.id}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Chapter {c.order}</p>
                  <h3 className="font-display text-lg font-semibold text-slate-900">{c.title}</h3>
                  {c.summary && <p className="mt-1 text-sm text-slate-600">{c.summary}</p>}
                </div>
                <span className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${openChapter === c.id ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}>
                    {openChapter === c.id ? "Close" : `${c.modules.length} lesson${c.modules.length === 1 ? "" : "s"}`}
                  </span>
                  {canStructure && (
                    <button
                      type="button"
                      onClick={() => setEditChapter((e) => (e === c.id ? null : c.id))}
                      className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                    >
                      {editChapter === c.id ? "Close" : "Edit"}
                    </button>
                  )}
                  {canStructure && (
                    <RemoveButton
                      label={`Delete chapter ${c.title}`}
                      onClick={async () => {
                        await api(`/chapters/${c.id}`, { method: "DELETE" }).catch(() => undefined);
                        onChanged?.();
                      }}
                    />
                  )}
                </span>
              </button>

              {openChapter === c.id && (
                <div className="space-y-4 border-t border-slate-100 p-5">
                  {canStructure && editChapter === c.id && (
                    <ChapterForm chapter={c} onDone={() => { setEditChapter(null); onChanged?.(); }} />
                  )}
                  <ChapterLinks chapter={c} meetings={meetings.filter((m) => m.chapter?.id === c.id)} />

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lessons in this chapter</p>
                    <ul className="mt-2 space-y-2">
                      {c.modules.length === 0 && (
                        <li className="text-sm text-slate-400">
                          {canLessons ? "No lessons yet — add the first one below." : "No lessons here yet."}
                        </li>
                      )}
                      {c.modules.map((mod) => (
                        <li key={mod.id} className="rounded-xl border border-slate-200 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="font-semibold text-slate-800">
                              <span className="text-slate-400">Lesson {mod.position}.</span> {mod.title}
                            </p>
                            <span className="flex shrink-0 items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setOpenModule((o) => (o === mod.id ? null : mod.id))}
                                className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                              >
                                {openModule === mod.id ? "Hide concepts" : `${mod.lessons.length} concept${mod.lessons.length === 1 ? "" : "s"}`}
                              </button>
                              {canLessons && (
                                <RemoveButton
                                  label={`Delete lesson ${mod.title}`}
                                  onClick={async () => {
                                    await api(`/courses/modules/${mod.id}`, { method: "DELETE" }).catch(() => undefined);
                                    onChanged?.();
                                  }}
                                />
                              )}
                            </span>
                          </div>



                          {openModule === mod.id && (
                            <ul className="mt-3 space-y-2 border-l-2 border-slate-100 pl-4">
                              {mod.lessons.length === 0 && <li className="text-sm text-slate-400">No concepts yet — add one below.</li>}
                              {mod.lessons.map((l) => (
                                <li key={l.id} className="rounded-lg bg-slate-50 px-3 py-2">
                                  <div className="flex items-center justify-between gap-3">
                                    <span className="flex min-w-0 items-center gap-2">
                                      <span className={`h-2 w-2 shrink-0 rounded-full ${TYPE_DOT[l.type]}`} />
                                      <span className="truncate text-sm font-medium text-slate-800">{l.title}</span>
                                      <span className="shrink-0 text-xs text-slate-400">{typeLabel(l.type)}</span>
                                    </span>
                                    {canConcepts && (
                                    <span className="flex shrink-0 gap-1">
                                      <button
                                        type="button"
                                        onClick={() => setEditLesson((e) => (e === l.id ? null : l.id))}
                                        className="rounded-md px-2 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                                      >
                                        {editLesson === l.id ? "Close" : "Edit"}
                                      </button>
                                      <RemoveButton
                                        label={`Delete concept ${l.title}`}
                                        onClick={async () => {
                                          await api(`/courses/lessons/${l.id}`, { method: "DELETE" }).catch(() => undefined);
onChanged?.();
                                          }}
                                      />
                                    </span>
                                    )}
                                  </div>
                                  <ResourceStrip resources={l.resources} />
                                  {editLesson === l.id && (
                                    <ConceptForm courseId={courseId} moduleId={mod.id} concept={l} onDone={() => { setEditLesson(null); onChanged?.(); }} />
                                  )}
                                </li>
                              ))}
                              {canConcepts && (
                                <li>
                                  <ConceptForm courseId={courseId} moduleId={mod.id} concept={null} onDone={() => onChanged?.()} />
                                </li>
                              )}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                    {canLessons && <AddLessonForm courseId={courseId} chapterId={c.id} onDone={() => onChanged?.()} />}
                  </div>
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
      <li className="flex items-start gap-3">
        <Node tone="ghost" />
        {canStructure && <AddChapterForm courseId={courseId} onDone={() => onChanged?.()} />}
      </li>
      </ol>
    </>
  );
}

/** Step 1 — the roadmap itself: title, intro, live class link, recording, resources. */
function RoadmapShellForm({
  courseId,
  roadmap,
  onDone,
}: {
  courseId: string;
  roadmap: RoadmapShell | null;
  onDone: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(!roadmap?.title);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await api("/chapters/roadmap", {
        method: "PUT",
        body: JSON.stringify({
          courseId,
          title: fd.get("title"),
          summary: fd.get("summary") || undefined,
          meetingUrl: fd.get("meetingUrl") || "",
          recordingUrl: fd.get("recordingUrl") || "",
          resources: parseResources(fd.get("resources") as string),
        }),
      });
      setEditing(false);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the roadmap");
    } finally {
      setBusy(false);
    }
  }

  if (roadmap?.title && !editing) {
    return (
      <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Your roadmap</p>
            <h3 className="font-display text-lg font-semibold text-slate-900">{roadmap.title}</h3>
            {roadmap.summary && <p className="mt-1 text-sm text-slate-600">{roadmap.summary}</p>}
          </div>
          <button type="button" onClick={() => setEditing(true)} className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200">
            Edit
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {roadmap.meetingUrl && <Link href={roadmap.meetingUrl} target="_blank" rel="noopener noreferrer" className="rounded-[10px] bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800">Live class link</Link>}
          {roadmap.recordingUrl && <Link href={roadmap.recordingUrl} target="_blank" rel="noopener noreferrer" className="rounded-[10px] border border-[1.5px] border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50">Recording link</Link>}
        </div>
        <ResourceStrip resources={roadmap.resources ?? []} />
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div>
        <h3 className="font-display text-lg font-semibold text-slate-900">
          {roadmap?.title ? "Edit roadmap" : "Create your roadmap"}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Start here. Name the roadmap, add your live class link, recordings and resources — then break it into
          chapters, lessons and concepts.
        </p>
      </div>
      <div>
        <label className={labelCls} htmlFor="rm-title">Roadmap title</label>
        <input id="rm-title" name="title" required defaultValue={roadmap?.title ?? ""} placeholder="e.g. Become a confident React engineer" className={inputShell + " " + inputCls} />
      </div>
      <div>
        <label className={labelCls} htmlFor="rm-summary">What will learners achieve?</label>
        <textarea id="rm-summary" name="summary" rows={2} defaultValue={roadmap?.summary ?? ""} placeholder="Short intro shown above every chapter" className={areaCls} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls} htmlFor="rm-meet">Live class link</label>
          <input id="rm-meet" name="meetingUrl" type="url" defaultValue={roadmap?.meetingUrl ?? ""} placeholder="https://meet.google.com/…" className={inputShell + " " + inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="rm-rec">Recording link</label>
          <input id="rm-rec" name="recordingUrl" type="url" defaultValue={roadmap?.recordingUrl ?? ""} placeholder="https://youtube.com/…" className={inputShell + " " + inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls} htmlFor="rm-res">Resources for the whole roadmap — label|url pairs, comma separated</label>
        <textarea id="rm-res" name="resources" rows={2} defaultValue={formatResources(roadmap?.resources ?? [])} placeholder="Starter pack|https://…, Syllabus|https://…" className={areaCls} />
      </div>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className={submitCls}>
        {busy ? "Saving…" : roadmap?.title ? "Save roadmap" : "Create roadmap"}
      </button>
    </form>
  );
}

function EmptyRoadmap({ canStructure }: { canStructure: boolean }) {
  return (
    <li className="rounded-2xl border border-dashed border-slate-300 p-5 text-sm text-slate-400">
      {canStructure ? "No chapters yet — add the first one below." : "No chapters published yet."}
    </li>
  );
}

function Node({ tone }: { tone: "brand" | "ghost" }) {
  return (
    <span className="relative z-10 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-white shadow-sm">
      <span className={`h-full w-full rounded-full ${tone === "brand" ? "bg-brand-500" : "border-2 border-dashed border-slate-300 bg-white"}`} />
    </span>
  );
}

/** Learner-side chapter: click to reveal links and lessons. */
function ChapterNode({
  chapter,
  meetings,
  open,
  locked,
  onToggle,
  openModule,
  onToggleModule,
  mode,
  completed,
  busyLesson,
  onComplete,
}: {
  chapter: RoadmapChapter;
  meetings: RoadmapMeeting[];
  open: boolean;
  locked: boolean;
  onToggle: () => void;
  openModule: string | null;
  onToggleModule: (id: string) => void;
  mode: "admin" | "mentor" | "learn";
  completed: string[];
  busyLesson: string | null;
  onComplete: (lessonId: string) => void;
}) {
  return (
    <li className="relative">
      <div className="flex items-start gap-3">
        <Node tone="brand" />
        <div className="min-w-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <button
            type="button"
            onClick={onToggle}
            disabled={locked}
            aria-expanded={open}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left enabled:hover:bg-slate-50"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Chapter {chapter.order}</p>
              <h3 className="font-display text-lg font-semibold text-slate-900">{chapter.title}</h3>
              {chapter.summary && <p className="mt-1 text-sm text-slate-600">{chapter.summary}</p>}
            </div>
            <span className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${open ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
              {locked && <span aria-hidden>🔒</span>}
              {chapter.modules.length} concept{chapter.modules.length === 1 ? "" : "s"}
            </span>
          </button>

          {open && !locked && (
            <div className="space-y-4 border-t border-slate-100 p-5">
              <ChapterLinks chapter={chapter} meetings={meetings} />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lessons in this chapter</p>
                <ul className="mt-2 space-y-2">
                  {chapter.modules.length === 0 && <li className="text-sm text-slate-400">No lessons here yet.</li>}
                  {chapter.modules.map((mod) => (
                    <li key={mod.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">
                            <span className="text-slate-400">Lesson {mod.position}.</span> {mod.title}
                          </p>
                          <ResourceStrip resources={mod.resources} />
                        </div>
                        <button
                          type="button"
                          onClick={() => onToggleModule(mod.id)}
                          className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                        >
                          {openModule === mod.id ? "Hide concepts" : `${mod.lessons.length} concept${mod.lessons.length === 1 ? "" : "s"}`}
                        </button>
                      </div>
                      {openModule === mod.id && (
                        <ul className="mt-3 space-y-2 border-l-2 border-slate-100 pl-4">
                          {mod.lessons.length === 0 && <li className="text-sm text-slate-400">No concepts yet.</li>}
                          {mod.lessons.map((l) => (
                            <LessonRow
                              key={l.id}
                              lesson={l}
                              done={completed.includes(l.id)}
                              canComplete={mode === "learn" && !locked}
                              busy={busyLesson === l.id}
                              onComplete={() => onComplete(l.id)}
                            />
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              {chapter.resources.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Resources</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {chapter.resources.map((r) => (
                      <li key={r.url}>
                        <Link href={r.url} target="_blank" rel="noopener noreferrer" className="inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100">
                          {r.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

/** Join window for a scheduled class: 15 min before start until end + 30 min grace. */
export function meetingJoinWindow(scheduledAt: string, durationMin = 60): { open: boolean; start: number; end: number } {
  const start = new Date(scheduledAt).getTime();
  const end = start + (durationMin + 30) * 60_000;
  const now = Date.now();
  return { open: now >= start - 15 * 60_000 && now <= end, start, end };
}

/** Recording / live links — shared by both modes. */
function ChapterLinks({ chapter, meetings }: { chapter: RoadmapChapter; meetings: RoadmapMeeting[] }) {
  const sorted = [...meetings].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const active = sorted.find((m) => meetingJoinWindow(m.scheduledAt).open);
  const nextUp = sorted.find((m) => new Date(m.scheduledAt).getTime() > Date.now());
  const joinUrl = active?.meetingUrl ?? chapter.meetingUrl;
  return (
    <div className="flex flex-wrap gap-3 text-sm">
      {joinUrl && (
        <Link href={joinUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white hover:bg-slate-700">
          Join live session
        </Link>
      )}
      {!joinUrl && nextUp && (
        <span className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 font-medium text-slate-500">
          Next live class {new Date(nextUp.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
        </span>
      )}
      {chapter.recordingUrl && (
        <Link href={chapter.recordingUrl} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:border-brand-400 hover:text-brand-700">
          Watch recording
        </Link>
      )}
      {chapter.resources.map((r) => (
        <Link key={r.url} href={r.url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:border-brand-400 hover:text-brand-700">
          {r.label}
        </Link>
      ))}
    </div>
  );
}

/** One lesson for learners: watch, join, read, tick off. */
function LessonRow({
  lesson,
  done,
  canComplete,
  busy,
  onComplete,
}: {
  lesson: RoadmapLesson;
  done: boolean;
  canComplete: boolean;
  busy: boolean;
  onComplete: () => void;
}) {
  return (
    <li className={`rounded-lg px-3 py-2 ${done ? "bg-emerald-50/70" : "bg-slate-50"}`}>
      <p className="flex items-center gap-2 text-sm font-medium text-slate-800">
        <span className={`h-2 w-2 shrink-0 rounded-full ${TYPE_DOT[lesson.type]}`} />
        {lesson.title}
        <span className="shrink-0 text-xs text-slate-400">{typeLabel(lesson.type)}</span>
        {canComplete && (
          <button
            type="button"
            onClick={onComplete}
            disabled={done || busy}
            aria-pressed={done}
            className={`ml-auto shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold transition disabled:cursor-default ${
              done ? "bg-emerald-100 text-emerald-700" : "bg-white text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
            }`}
          >
            {done ? "✓ Done" : busy ? "Saving…" : "Mark done"}
          </button>
        )}
      </p>
      <ResourceStrip resources={lesson.resources} />
      <div className="mt-2 flex flex-wrap gap-2">
        {lesson.meetingUrl && (
          <Link href={lesson.meetingUrl} target="_blank" rel="noopener noreferrer" className="rounded-md bg-slate-900 px-2.5 py-1 text-xs font-semibold text-white hover:bg-slate-700">
            Join meeting
          </Link>
        )}
        {lesson.contentUrl && (
          <Link href={lesson.contentUrl} target="_blank" rel="noopener noreferrer" className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-brand-400 hover:text-brand-700">
            {lesson.type === "VIDEO" ? "Watch class" : "Open"}
          </Link>
        )}
        {lesson.textContent && (
          <details className="w-full">
            <summary className="cursor-pointer text-xs font-semibold text-brand-700">Notes & resources</summary>
            <p className="mt-1 whitespace-pre-wrap text-xs text-slate-600">{lesson.textContent}</p>
          </details>
        )}
      </div>
    </li>
  );
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void | Promise<void> }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await onClick();
        } finally {
          setBusy(false);
        }
      }}
      className="rounded-md px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      {busy ? "…" : "Delete"}
    </button>
  );
}

// ── Authoring forms. Same shells as login/profile: 50px inputs, semibold labels.

function FormShell({ children, onSubmit, submitLabel }: { children: React.ReactNode; onSubmit: (e: FormEvent) => void; submitLabel: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          await onSubmit(e);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
          setBusy(false);
        }
      }}
      className="mt-3 space-y-3"
    >
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
      {children}
      <button type="submit" disabled={busy} className={submitCls}>
        {busy ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

/** Admin edit of a chapter: title, summary, course-wide live link, recording, resources. */
function ChapterForm({
  chapter,
  onDone,
}: {
  chapter: RoadmapChapter;
  onDone: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-800">Edit chapter {chapter.order}</p>
      <FormShell
        submitLabel="Save chapter"
        onSubmit={async (e) => {
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          await api(`/chapters/${chapter.id}`, {
            method: "PATCH",
            body: JSON.stringify({
              title: fd.get("title"),
              summary: fd.get("summary") || undefined,
              meetingUrl: fd.get("meetingUrl") || "",
              recordingUrl: fd.get("recordingUrl") || "",
              resources: parseResources(fd.get("resources") as string),
            }),
          });
          onDone();
        }}
      >
        <div>
          <label className={labelCls} htmlFor={`ch-edit-title-${chapter.id}`}>Chapter title</label>
          <input id={`ch-edit-title-${chapter.id}`} name="title" required defaultValue={chapter.title} className={inputShell + " " + inputCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor={`ch-edit-sum-${chapter.id}`}>Summary</label>
          <textarea id={`ch-edit-sum-${chapter.id}`} name="summary" rows={2} defaultValue={chapter.summary ?? ""} className={areaCls} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls} htmlFor={`ch-edit-meet-${chapter.id}`}>Live class link</label>
            <input id={`ch-edit-meet-${chapter.id}`} name="meetingUrl" type="url" defaultValue={chapter.meetingUrl ?? ""} placeholder="https://meet.google.com/…" className={inputShell + " " + inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor={`ch-edit-rec-${chapter.id}`}>Recording link</label>
            <input id={`ch-edit-rec-${chapter.id}`} name="recordingUrl" type="url" defaultValue={chapter.recordingUrl ?? ""} placeholder="https://youtube.com/…" className={inputShell + " " + inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor={`ch-edit-res-${chapter.id}`}>Resources — label|url pairs, comma separated</label>
          <textarea id={`ch-edit-res-${chapter.id}`} name="resources" rows={2} defaultValue={formatResources(chapter.resources)} placeholder="Slides|https://…, Notes|https://…" className={areaCls} />
        </div>
      </FormShell>
    </div>
  );
}

function AddChapterForm({ courseId, onDone }: { courseId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-slate-300 px-5 py-4 text-sm font-semibold text-slate-600 transition hover:border-brand-400 hover:text-brand-700"
      >
        <PlusIcon /> Add chapter
      </button>
    );
  }
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-semibold text-slate-800">New chapter</p>
      <FormShell
        submitLabel="Add chapter"
        onSubmit={async (e) => {
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const resources = (fd.get("resources") as string)
            .split(",")
            .map((pair) => pair.split("|").map((s) => s.trim()))
            .filter(([label, url]) => label && url)
            .map(([label, url]) => ({ label: label!, url: url! }));
          await api("/chapters", {
            method: "POST",
            body: JSON.stringify({
              courseId,
              title: fd.get("title"),
              ...(fd.get("summary") ? { summary: fd.get("summary") } : {}),
              ...(fd.get("meetingUrl") ? { meetingUrl: fd.get("meetingUrl") } : {}),
              ...(fd.get("recordingUrl") ? { recordingUrl: fd.get("recordingUrl") } : {}),
              ...(resources.length ? { resources } : {}),
            }),
          });
          (e.currentTarget as HTMLFormElement).reset();
          setOpen(false);
          onDone();
        }}
      >
        <div>
          <label className={labelCls} htmlFor="ch-title">Chapter title</label>
          <div className={inputShell}>
            <input id="ch-title" name="title" required placeholder="e.g. Algebra foundations" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="ch-summary">Summary (optional)</label>
          <textarea id="ch-summary" name="summary" rows={2} placeholder="What this chapter covers" className={areaCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor="ch-meet">Online meeting link (optional)</label>
          <div className={inputShell}>
            <input id="ch-meet" name="meetingUrl" type="url" placeholder="https://meet…/…" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="ch-rec">Recorded class link (optional)</label>
          <div className={inputShell}>
            <input id="ch-rec" name="recordingUrl" type="url" placeholder="https://…" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor="ch-res">Resources — label|url pairs, comma separated</label>
          <textarea id="ch-res" name="resources" rows={2} placeholder="Worksheet|https://…, Notes|https://…" className={areaCls} />
        </div>
      </FormShell>
      <button type="button" onClick={() => setOpen(false)} className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-800">
        Cancel
      </button>
    </div>
  );
}

function AddLessonForm({ courseId, chapterId, onDone }: { courseId: string; chapterId: string; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
        <PlusIcon /> Add lesson
      </button>
    );
  }
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <FormShell
        submitLabel="Add lesson"
        onSubmit={async (e) => {
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          await api(`/courses/${courseId}/modules`, {
            method: "POST",
            headers: { "x-chapter-id": chapterId },
            body: JSON.stringify({ title: fd.get("title") }),
          });
          (e.currentTarget as HTMLFormElement).reset();
          setOpen(false);
          onDone();
        }}
      >
        <div>
          <label className={labelCls} htmlFor="mc-title">Lesson title</label>
          <div className={inputShell}>
            <input id="mc-title" name="title" required placeholder="e.g. Solving quadratic equations" className={inputCls} />
          </div>
        </div>
      </FormShell>
      <button type="button" onClick={() => setOpen(false)} className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-800">
        Cancel
      </button>
    </div>
  );
}

function ConceptForm({
  courseId,
  moduleId,
  concept: lesson,
  onDone,
}: {
  courseId: string;
  moduleId: string;
  concept: RoadmapLesson | null;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(lesson === null);
  if (!open) return null;
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-800">{lesson ? "Edit concept" : "New concept"}</p>
      <FormShell
        submitLabel={lesson ? "Save concept" : "Add concept"}
        onSubmit={async (e) => {
          const fd = new FormData(e.currentTarget as HTMLFormElement);
          const payload = {
            title: fd.get("title"),
            type: fd.get("type"),
            contentUrl: fd.get("contentUrl") || "",
            meetingUrl: fd.get("meetingUrl") || "",
            textContent: fd.get("textContent") || undefined,
            resources: parseResources(fd.get("resources") as string),
          };
          if (lesson) {
            await api(`/courses/lessons/${lesson.id}`, { method: "PATCH", body: JSON.stringify(payload) });
          } else {
            await api(`/courses/${courseId}/lessons`, {
              method: "POST",
              headers: { "x-module-id": moduleId },
              body: JSON.stringify(payload),
            });
          }
          (e.currentTarget as HTMLFormElement).reset();
          onDone();
        }}
      >
        <div>
          <label className={labelCls} htmlFor={`ls-title-${lesson?.id ?? "new"}`}>Lesson title</label>
          <div className={inputShell}>
            <input id={`ls-title-${lesson?.id ?? "new"}`} name="title" required defaultValue={lesson?.title ?? ""} placeholder="e.g. Solving by factoring" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor={`ls-type-${lesson?.id ?? "new"}`}>Type</label>
          <div className={inputShell}>
            <select id={`ls-type-${lesson?.id ?? "new"}`} name="type" defaultValue={lesson?.type ?? "VIDEO"} className={`${inputCls} appearance-none`}>
              {LESSON_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor={`ls-video-${lesson?.id ?? "new"}`}>Video recording link</label>
          <div className={inputShell}>
            <input id={`ls-video-${lesson?.id ?? "new"}`} name="contentUrl" type="url" defaultValue={lesson?.contentUrl ?? ""} placeholder="https://…" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor={`ls-meet-${lesson?.id ?? "new"}`}>Live class link</label>
          <div className={inputShell}>
            <input id={`ls-meet-${lesson?.id ?? "new"}`} name="meetingUrl" type="url" defaultValue={lesson?.meetingUrl ?? ""} placeholder="https://meet…/…" className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls} htmlFor={`ls-notes-${lesson?.id ?? "new"}`}>Notes & resource links</label>
          <textarea id={`ls-notes-${lesson?.id ?? "new"}`} name="textContent" rows={3} defaultValue={lesson?.textContent ?? ""} placeholder="Notes for students" className={areaCls} />
        </div>
        <div>
          <label className={labelCls} htmlFor={`ls-res-${lesson?.id ?? "new"}`}>Resources — label|url pairs, comma separated</label>
          <textarea id={`ls-res-${lesson?.id ?? "new"}`} name="resources" rows={2} defaultValue={formatResources(lesson?.resources)} placeholder="Worksheet|https://…, Slides|https://…" className={areaCls} />
        </div>
      </FormShell>
      <button type="button" onClick={() => setOpen(false)} className="mt-2 text-xs font-semibold text-slate-500 hover:text-slate-800">
        Cancel
      </button>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
