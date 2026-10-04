"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, getAccessToken, API_BASE, getCachedUser } from "@/lib/api";
import CourseRoadmap, { type RoadmapChapter, type RoadmapShell } from "./CourseRoadmap";

interface Meeting {
  id: string;
  title: string;
  scheduledAt: string;
  durationMin: number;
  meetingUrl: string;
  chapter: { id: string; title: string } | null;
}

interface CourseResource {
  id: string;
  title: string;
  subject: string;
  kind: string;
  fileUrl: string;
  courseId: string | null;
}

export function MentorCoursePanel({
  courseId,
  courseSlug,
  courseMentorId,
  courseTitle,
}: {
  courseId: string;
  courseSlug: string;
  courseMentorId: string;
  courseTitle: string;
}) {
  const [chapters, setChapters] = useState<RoadmapChapter[]>([]);
  const [roadmap, setRoadmap] = useState<RoadmapShell | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    void (async () => {
      const cm = await api<{ mentorship: Array<{ id: string; chapters: RoadmapChapter[] }> }>("/chapters/mine").catch(() => null);
      const mine = cm?.mentorship.find((m) => m.id === courseMentorId);
      if (mine) setChapters(mine.chapters);

      api<{ meetings: Meeting[] }>(`/meetings/course/${courseId}`)
        .then((d) => setMeetings(d.meetings))
        .catch(() => undefined);
      api<{ items: CourseResource[] }>(`/resources/my`)
        .then((d) => setResources(d.items.filter((r) => r.courseId === courseId)))
        .catch(() => undefined);
    })();
  }, [courseId, courseMentorId, courseSlug]);

  useEffect(load, [load]);

  // ── Chapters ──
  async function addChapter(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      const resourcesRaw = (fd.get("resources") as string) ?? "";
      const resources = resourcesRaw
        .split(",")
        .map((pair) => pair.split("|").map((s) => s.trim()))
        .filter(([label, url]) => label && url)
        .map(([label, url]) => ({ label, url }));
      await api("/chapters", {
        method: "POST",
        body: JSON.stringify({
          courseMentorId,
          title: fd.get("title"),
          ...(fd.get("summary") ? { summary: fd.get("summary") } : {}),
          ...(fd.get("meetingUrl") ? { meetingUrl: fd.get("meetingUrl") } : {}),
          ...(fd.get("recordingUrl") ? { recordingUrl: fd.get("recordingUrl") } : {}),
          ...(resources.length ? { resources } : {}),
        }),
      });
      load();
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the chapter");
    } finally {
      setBusy(false);
    }
  }


  // ── Live classes ──

  // ── Course resources ──
  async function uploadResource(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const fileName = (e.currentTarget.elements.namedItem("title") as HTMLInputElement).value.trim();
    const kind = (e.currentTarget.elements.namedItem("kind") as HTMLSelectElement).value;
    const token = getAccessToken();
    if (!token) return setError("Sign in to upload files");

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/resources/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/octet-stream",
          "x-resource-title": fileName,
          "x-resource-subject": courseTitle,
          "x-resource-kind": kind,
          "x-resource-file": file.name,
          "x-resource-mime": file.type || "application/octet-stream",
          "x-resource-course": courseId,
        },
        body: file,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Upload failed");
      }
      e.currentTarget.reset();
      api<{ items: CourseResource[] }>(`/resources/my`)
        .then((d) => setResources(d.items.filter((r) => r.courseId === courseId)))
        .catch(() => undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

async function removeResource(id: string) {
    await api(`/resources/${id}`, { method: "DELETE" }).catch(() => undefined);
    api<{ items: CourseResource[] }>(`/resources/my`)
      .then((d) => setResources(d.items.filter((r) => r.courseId === courseId)))
      .catch(() => undefined);
  }

  const me = getCachedUser();

  return (
    <div className="space-y-10">
      <h2 className="font-display text-2xl font-semibold text-slate-900">Mentoring tools</h2>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {/* Roadmap — the course path. Chapters, concepts and lessons, authored in place. */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-display text-lg font-semibold text-slate-900">Roadmap</h3>
        <p className="mt-1 text-sm text-slate-500">
          Create the roadmap first — name it, add your live class link, recordings and resources. Then break it into
          chapters, lessons and concepts.
        </p>
        <CourseRoadmap
          courseId={courseId}
          mentorId={courseMentorId}
          chapters={chapters}
          roadmap={roadmap}
          meetings={meetings}
          mode="mentor"
          onChanged={load}
        />
      </section>

      {/* Course resources */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-display text-lg font-semibold text-slate-900">Resources for this course</h3>
        <form onSubmit={uploadResource} className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <input name="title" required placeholder="Resource title" className={inputCls} />
          <select name="kind" className={inputCls} defaultValue="pdf">
            {["pdf", "doc", "slides", "video", "link", "audio"].map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <input required name="file" type="file" className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white" />
          <button type="submit" disabled={busy} className="rounded-lg brand-grad px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {busy ? "Uploading…" : "Upload"}
          </button>
        </form>
        <ul className="mt-4 divide-y divide-slate-100">
          {resources.length === 0 && <li className="text-sm text-slate-400">No resources yet.</li>}
          {resources.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-3 py-2">
              <Link href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="min-w-0 truncate text-sm text-slate-700 hover:text-brand-700">
                {r.title} <span className="text-slate-400">· {r.kind}</span>
              </Link>
              <button onClick={() => removeResource(r.id)} className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700">Delete</button>
            </li>
          ))}
        </ul>
      </section>

    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

