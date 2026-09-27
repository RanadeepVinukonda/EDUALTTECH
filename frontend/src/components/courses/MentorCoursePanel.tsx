"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api, getAccessToken, API_BASE, getCachedUser } from "@/lib/api";

interface Chapter {
  id: string;
  title: string;
  summary: string | null;
  order: number;
  meetingUrl: string | null;
  recordingUrl: string | null;
  resources: Array<{ label: string; url: string }>;
}

interface ModuleRow {
  id: string;
  title: string;
  position: number;
  lessons: Array<{ id: string; title: string; type: string; position: number }>;
}

interface Meeting {
  id: string;
  title: string;
  scheduledAt: string;
  durationMin: number;
  meetingUrl: string;
}

interface CourseResource {
  id: string;
  title: string;
  subject: string;
  kind: string;
  fileUrl: string;
  courseId: string | null;
}

interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  enrollment: { id: string; course: { title: string; slug: string }; studentId: string };
  _count: { messages: number };
}

interface ConversationMsg {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  sender: { name: string; avatarUrl: string | null };
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
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [modules, setModules] = useState<ModuleRow[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [resources, setResources] = useState<CourseResource[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeConv, setActiveConv] = useState<string | null>(null);

  const load = useCallback(() => {
    void (async () => {
      const cm = await api<{ mentorship: Array<{ id: string; chapters: Chapter[] }> }>("/chapters/mine").catch(() => null);
      const mine = cm?.mentorship.find((m) => m.id === courseMentorId);
      if (mine) setChapters(mine.chapters);

      api<{ modules: ModuleRow[] }>(`/courses/${courseId}/modules`)
        .then((d) => setModules(d.modules))
        .catch(() => undefined);
      api<{ meetings: Meeting[] }>(`/meetings/course/${courseId}`)
        .then((d) => setMeetings(d.meetings))
        .catch(() => undefined);
      api<{ items: CourseResource[] }>(`/resources/my`)
        .then((d) => setResources(d.items.filter((r) => r.courseId === courseId)))
        .catch(() => undefined);
      const convs = await api<{ conversations: Conversation[] }>("/cms/conversations").catch(() => null);
      if (convs) setConversations(convs.conversations.filter((c) => c.enrollment.course.slug === courseSlug));
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
      const resources = (fd.get("resources") as string)
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

  async function removeChapter(id: string) {
    await api(`/chapters/${id}`, { method: "DELETE" }).catch(() => undefined);
    load();
  }

  // ── Modules & lessons ──
  async function addModule(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api(`/courses/${courseId}/modules`, {
        method: "POST",
        body: JSON.stringify({ title: new FormData(e.currentTarget).get("title") }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the module");
    } finally {
      setBusy(false);
    }
  }

  async function addLesson(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await api(`/courses/${courseId}/lessons`, {
        method: "POST",
        headers: { "x-module-id": fd.get("moduleId") as string },
        body: JSON.stringify({ title: fd.get("title"), type: fd.get("type") ?? "READING" }),
      });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the lesson");
    } finally {
      setBusy(false);
    }
  }

  async function removeModule(id: string) {
    await api(`/courses/modules/${id}`, { method: "DELETE" }).catch(() => undefined);
    load();
  }

  async function removeLesson(id: string) {
    await api(`/courses/lessons/${id}`, { method: "DELETE" }).catch(() => undefined);
    load();
  }

  // ── Live classes ──
  async function addMeeting(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await api("/meetings", {
        method: "POST",
        body: JSON.stringify({
          courseId,
          title: fd.get("title"),
          scheduledAt: new Date(fd.get("scheduledAt") as string).toISOString(),
          meetingUrl: fd.get("meetingUrl"),
        }),
      });
      load();
      e.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule the live class");
    } finally {
      setBusy(false);
    }
  }

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
      <p className="text-sm text-slate-500">
        Everything in this course is yours to manage. Emails to students are sent automatically when you schedule a live class.
      </p>

      {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {/* Chapters / roadmap */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-display text-lg font-semibold text-slate-900">Roadmap</h3>
        <form onSubmit={addChapter} className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
          <input name="title" required placeholder="Chapter title" className={inputCls} />
          <input name="meetingUrl" placeholder="Live session link (https://…)" className={inputCls} />
          <input name="recordingUrl" placeholder="Recording / YouTube link" className={inputCls} />
          <input name="resources" placeholder="Resources: Label|https://link, Label 2|https://link" className={inputCls} />
          <textarea name="summary" rows={2} placeholder="Chapter summary (optional)" className={`${inputCls} sm:col-span-2`} />
          <button type="submit" disabled={busy} className="rounded-lg brand-grad px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            {busy ? "Saving…" : "Add chapter"}
          </button>
        </form>
        <ol className="mt-4 space-y-2">
          {chapters.length === 0 && <li className="text-sm text-slate-400">No chapters yet — start your roadmap above.</li>}
          {chapters.map((c) => (
            <li key={c.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Chapter {c.order}</p>
                <p className="text-sm font-medium text-slate-900">{c.title}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs">
                  {c.meetingUrl && <Link href={c.meetingUrl}>Meet →</Link>}
                  {c.recordingUrl && <Link href={c.recordingUrl}>Recording →</Link>}
                </div>
              </div>
              <button onClick={() => removeChapter(c.id)} className="shrink-0 text-xs font-medium text-red-600 hover:text-red-700">
                Delete
              </button>
            </li>
          ))}
        </ol>
      </section>

      {/* Modules & lessons */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-display text-lg font-semibold text-slate-900">Modules & lessons</h3>
        <form onSubmit={addModule} className="mt-4 flex gap-2">
          <input name="title" required placeholder="New module name" className={inputCls} />
          <button type="submit" disabled={busy} className="shrink-0 rounded-lg brand-grad px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
            Add module
          </button>
        </form>

        <ul className="mt-4 space-y-3">
          {modules.length === 0 && <li className="text-sm text-slate-400">No modules yet.</li>}
          {modules.map((mod) => (
            <li key={mod.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <p className="font-medium text-slate-900">Module {mod.position} · {mod.title}</p>
                <button onClick={() => removeModule(mod.id)} className="text-xs font-medium text-red-600 hover:text-red-700">
                  Delete
                </button>
              </div>
              <form onSubmit={addLesson} className="mt-2 flex flex-wrap gap-2">
                <input name="title" required placeholder="Lesson title" className={`${inputCls} flex-1 min-w-40`} />
                <select name="type" className={inputCls}>
                  <option value="READING">Reading</option>
                  <option value="VIDEO">Video</option>
                  <option value="QUIZ">Quiz</option>
                  <option value="ASSIGNMENT">Assignment</option>
                </select>
                <input type="hidden" name="moduleId" value={mod.id} />
                <button type="submit" disabled={busy} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
                  Add lesson
                </button>
              </form>
              <ul className="mt-2 space-y-1">
                {mod.lessons.map((l) => (
                  <li key={l.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                    <span className="text-slate-700">{l.position}. {l.title} <span className="text-xs text-slate-400">({l.type})</span></span>
                    <button onClick={() => removeLesson(l.id)} className="text-xs font-medium text-red-600 hover:text-red-700">Delete</button>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      {/* Live classes — emails students automatically */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-display text-lg font-semibold text-slate-900">Live classes</h3>
        <p className="text-sm text-slate-500">Scheduling one emails every enrolled student the join link.</p>
        <form onSubmit={addMeeting} className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">
          <input name="title" required placeholder="Class title" className={inputCls} />
          <input name="scheduledAt" required type="datetime-local" className={inputCls} />
          <input name="meetingUrl" required placeholder="Meet link (https://…)" className={inputCls} />
          <div className="sm:col-span-3">
            <button type="submit" disabled={busy} className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
              {busy ? "Scheduling…" : "Schedule class + email students"}
            </button>
          </div>
        </form>
        <ul className="mt-4 space-y-2">
          {meetings.length === 0 && <li className="text-sm text-slate-400">No upcoming classes.</li>}
          {meetings.map((mt) => (
            <li key={mt.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-slate-900">{mt.title}</p>
                <p className="text-xs text-slate-500">
                  {new Date(mt.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {mt.durationMin} min
                </p>
              </div>
              <Link href={mt.meetingUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700">
                Join
              </Link>
            </li>
          ))}
        </ul>
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

      {/* All student conversations — visible + replyable */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="font-display text-lg font-semibold text-slate-900">Student chats</h3>
        <p className="text-sm text-slate-500">Every 1-on-1 conversation from students in this course — reply to each.</p>
        {conversations.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No student conversations yet.</p>
        ) : activeConv ? (
          <StudentThread conversation={conversations.find((c) => c.id === activeConv) ?? null} onBack={() => setActiveConv(null)} />
        ) : (
          <ul className="mt-4 space-y-2">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActiveConv(c.id)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-900">{c.title ?? c.enrollment.course.title}</span>
                  <span className="block text-xs text-slate-500">{c._count.messages} messages · started {new Date(c.createdAt).toLocaleDateString()}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200";

function StudentThread({ conversation, onBack }: { conversation: Conversation | null; onBack: () => void }) {
  const [messages, setMessages] = useState<ConversationMsg[]>([]);
  const [draft, setDraft] = useState("");
  const [meId, setMeId] = useState("");
  const me = getCachedUser();

  useEffect(() => {
    if (!conversation) return;
    setMeId(me?.id ?? "");
    api<{ messages: ConversationMsg[] }>(`/cms/conversations/${conversation.id}/messages`)
      .then((d) => setMessages(d.messages))
      .catch(() => undefined);
  }, [conversation, me?.id]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!conversation || !draft.trim()) return;
    const body = draft;
    setDraft("");
    try {
      const d = await api<{ message: ConversationMsg }>(`/cms/conversations/${conversation.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setMessages((m) => [...m, d.message]);
    } catch {
      setDraft(body);
    }
  }

  if (!conversation) return null;

  return (
    <div className="mt-4">
      <button onClick={onBack} className="text-xs font-medium text-slate-500 hover:text-brand-700">← All conversations</button>
      <div className="mt-2 max-h-80 space-y-3 overflow-y-auto rounded-xl bg-slate-50 p-4">
        {messages.length === 0 && <p className="text-center text-sm text-slate-400">No messages yet.</p>}
        {messages.map((m) => {
          const mine = m.senderId === meId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${mine ? "brand-grad text-white" : "bg-white text-slate-800 shadow-sm"}`}>
                {!mine && <p className="text-xs font-semibold text-slate-500">{m.sender.name}</p>}
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            </div>
          );
        })}
      </div>
      <form onSubmit={send} className="mt-2 flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Reply to this student…" className={inputCls} />
        <button type="submit" disabled={!draft.trim()} className="shrink-0 rounded-lg brand-grad px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
          Send
        </button>
      </form>
    </div>
  );
}