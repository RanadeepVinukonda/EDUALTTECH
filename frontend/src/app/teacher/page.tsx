"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError, getCachedUser, type User } from "@/lib/api";

interface PanelData {
  courses: Array<{
    id: string;
    title: string;
    slug: string;
    subject: string;
    isPublished: boolean;
    _count: { enrollments: number; modules: number; chats: number };
  }>;
  notifications: Array<{ id: string; title: string; body: string; createdAt: string }>;
}

interface Chapter {
  id: string;
  title: string;
  summary: string | null;
  order: number;
  meetingUrl: string | null;
  recordingUrl: string | null;
  resources: Array<{ label: string; url: string }>;
}

interface Mentorship {
  id: string;
  course: { id: string; title: string; slug: string };
  chapters: Chapter[];
  _count: { enrollments: number };
}

const EMPTY = { title: "", summary: "", meetingUrl: "", recordingUrl: "", resources: "" };
const EMPTY_MEETING = { mtitle: "", mscheduledAt: "", mmeetingUrl: "" };

export default function ProviderWorkspacePage() {
  const [user, setUser] = useState<User | null>(null);
  const [panel, setPanel] = useState<PanelData | null>(null);
  const [mentorship, setMentorship] = useState<Mentorship[]>([]);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [meetOpen, setMeetOpen] = useState<string | null>(null);
  const [meetingForm, setMeetingForm] = useState({ ...EMPTY_MEETING });
  const [meetings, setMeetings] = useState<Record<string, Array<{ id: string; title: string; scheduledAt: string; durationMin: number }>>>({});
  const [meetingBusy, setMeetingBusy] = useState(false);

  useEffect(() => {
    setUser(getCachedUser());
    load();
  }, []);

  function load() {
    api<PanelData>("/teachers/panel")
      .then(setPanel)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load workspace"));

    api<{ mentorship: Mentorship[] }>("/chapters/mine")
      .then((d) => setMentorship(d.mentorship))
      .catch(() => undefined);
  }

  async function addChapter(e: FormEvent, courseMentorId: string) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const resources = form.resources
        .split(",")
        .map((pair) => pair.split("|").map((s) => s.trim()))
        .filter(([label, url]) => label && url)
        .map(([label, url]) => ({ label, url }));

      await api("/chapters", {
        method: "POST",
        body: JSON.stringify({
          courseMentorId,
          title: form.title,
          ...(form.summary ? { summary: form.summary } : {}),
          ...(form.meetingUrl ? { meetingUrl: form.meetingUrl } : {}),
          ...(form.recordingUrl ? { recordingUrl: form.recordingUrl } : {}),
          ...(resources.length ? { resources } : {}),
        }),
      });
      setForm({ ...EMPTY });
      setOpenFor(null);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the chapter");
    } finally {
      setBusy(false);
    }
  }

  async function removeChapter(id: string) {
    try {
      await api(`/chapters/${id}`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the chapter");
    }
  }

  function loadMeetings(courseId: string) {
    api<{ meetings: Array<{ id: string; title: string; scheduledAt: string; durationMin: number }> }>(`/meetings/course/${courseId}`)
      .then((d) => setMeetings((m) => ({ ...m, [courseId]: d.meetings })))
      .catch(() => undefined);
  }

  async function addMeeting(e: FormEvent) {
    e.preventDefault();
    if (!meetOpen) return;
    setMeetingBusy(true);
    setError(null);
    try {
      await api("/meetings", {
        method: "POST",
        body: JSON.stringify({
          courseId: meetOpen,
          title: meetingForm.mtitle,
          scheduledAt: new Date(meetingForm.mscheduledAt).toISOString(),
          meetingUrl: meetingForm.mmeetingUrl,
        }),
      });
      setMeetingForm({ ...EMPTY_MEETING });
      setMeetOpen(null);
      loadMeetings(meetOpen);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule the live class");
    } finally {
      setMeetingBusy(false);
    }
  }

  if (error && !panel) return <div className="mx-auto max-w-6xl px-4 py-16 text-red-600">{error}</div>;
  if (!panel) return <div className="mx-auto max-w-6xl px-4 py-16 text-slate-500">Loading your workspace…</div>;

  const isProvider = mentorship.length > 0 || getCachedUser()?.isProvider === true;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-slate-900">Mentor workspace</h1>
      <p className="mt-1 text-slate-600">
        {isProvider
          ? "Manage the courses you guide and build each chapter's roadmap."
          : "You are not mentoring any course yet."}
      </p>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {!isProvider && (
        <div className="mt-8 rounded-3xl border border-brand-200 bg-brand-50 p-8">
          <h2 className="font-display text-lg font-semibold text-brand-900">Want to guide learners?</h2>
          <p className="mt-1 text-sm text-brand-800">
            Apply to mentor any course. Once an admin approves, that course and its chapter builder show up here.
          </p>
          <Link href="/teachers/apply" className="mt-4 inline-block rounded-xl bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700">
            Apply to mentor
          </Link>
        </div>
      )}

      {mentorship.map((m) => (
        <section key={m.id} className="mt-10 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{m.course.slug}</p>
              <h2 className="font-display text-xl font-semibold text-slate-900">{m.course.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{m._count.enrollments} learners with you</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setMeetOpen(meetOpen === m.course.id ? null : m.course.id);
                  setMeetingForm({ ...EMPTY_MEETING });
                }}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                {meetOpen === m.course.id ? "Cancel" : "Schedule live class"}
              </button>
              <button
                onClick={() => {
                  setOpenFor(openFor === m.id ? null : m.id);
                  setForm({ ...EMPTY });
                }}
                className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                {openFor === m.id ? "Cancel" : "Add chapter"}
              </button>
            </div>
          </div>

          {meetOpen === m.course.id && (
            <form onSubmit={addMeeting} className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-3">
              <Input label="Title" value={meetingForm.mtitle} onChange={(v) => setMeetingForm((f) => ({ ...f, mtitle: v }))} required />
              <Input label="Date & time" type="datetime-local" value={meetingForm.mscheduledAt} onChange={(v) => setMeetingForm((f) => ({ ...f, mscheduledAt: v }))} required />
              <Input label="Meet link" value={meetingForm.mmeetingUrl} onChange={(v) => setMeetingForm((f) => ({ ...f, mmeetingUrl: v }))} required />
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={meetingBusy}
                  className="rounded-xl bg-slate-900 px-6 py-2.5 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {meetingBusy ? "Scheduling…" : "Schedule class"}
                </button>
              </div>
            </form>
          )}

          {meetings[m.course.id] && meetings[m.course.id].length > 0 && (
            <ul className="mt-4 space-y-2">
              {meetings[m.course.id].map((mt) => (
                <li key={mt.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{mt.title}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(mt.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · {mt.durationMin} min
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {openFor === m.id && (
            <form onSubmit={(e) => addChapter(e, m.id)} className="mt-5 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:grid-cols-2">
              <Input label="Chapter title" value={form.title} onChange={(v) => setForm((f) => ({ ...f, title: v }))} required />
              <Input label="Meet link" value={form.meetingUrl} onChange={(v) => setForm((f) => ({ ...f, meetingUrl: v }))} placeholder="https://meet…" />
              <Input label="Recording / YouTube link" value={form.recordingUrl} onChange={(v) => setForm((f) => ({ ...f, recordingUrl: v }))} placeholder="https://youtube…" />
              <Input
                label="Resources"
                value={form.resources}
                onChange={(v) => setForm((f) => ({ ...f, resources: v }))}
                placeholder="Label|https://link, Label 2|https://link"
              />
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">Summary</label>
                <textarea
                  rows={2}
                  value={form.summary}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={busy}
                  className="rounded-xl bg-brand-600 px-6 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  {busy ? "Saving…" : "Save chapter"}
                </button>
              </div>
            </form>
          )}

          {m.chapters.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
              No chapters yet. Add your first one to start the roadmap.
            </p>
          ) : (
            <ol className="mt-5 space-y-3">
              {m.chapters.map((c) => (
                <li key={c.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Chapter {c.order}</p>
                      <p className="font-medium text-slate-900">{c.title}</p>
                      {c.summary && <p className="mt-1 text-sm text-slate-600">{c.summary}</p>}
                      <div className="mt-2 flex flex-wrap gap-3 text-xs">
                        {c.meetingUrl && <Link className="font-medium text-brand-700 hover:text-brand-800" href={c.meetingUrl}>Meet link</Link>}
                        {c.recordingUrl && <Link className="font-medium text-brand-700 hover:text-brand-800" href={c.recordingUrl}>Recording</Link>}
                        {c.resources.map((r) => (
                          <Link key={r.url} className="font-medium text-brand-700 hover:text-brand-800" href={r.url}>
                            {r.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                    <button onClick={() => removeChapter(c.id)} className="text-xs font-medium text-red-600 hover:text-red-700">
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      ))}

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-slate-900">My courses</h2>
        {panel.courses.length === 0 ? (
          <p className="mt-4 text-slate-500">No courses yet.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-3">Course</th>
                  <th className="px-5 py-3">Learners</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {panel.courses.map((c) => (
                  <tr key={c.id}>
                    <td className="px-5 py-3 font-medium text-slate-900">{c.title}</td>
                    <td className="px-5 py-3">{c._count.enrollments}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.isPublished ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"}`}>
                        {c.isPublished ? "Published" : "Draft"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-slate-900">Recent announcements</h2>
        {panel.notifications.length === 0 ? (
          <p className="mt-4 text-slate-500">Nothing sent yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {panel.notifications.map((n) => (
              <li key={n.id} className="rounded-xl border border-slate-200 bg-white p-4">
                <p className="font-medium text-slate-900">{n.title}</p>
                <p className="text-sm text-slate-600">{n.body}</p>
                <p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {user && (
        <p className="mt-10 text-center text-sm text-slate-500">
          Looking to learn instead?{" "}
          <Link href="/dashboard" className="font-semibold text-brand-700 hover:text-brand-800">Go to your learning dashboard</Link>
        </p>
      )}
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  type?: string;
}) {
  const id = label.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        id={id}
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
      />
    </div>
  );
}