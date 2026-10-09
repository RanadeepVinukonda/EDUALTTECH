"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { MeetingRow, MyCourses } from "@/lib/app-types";
import { formatDate, localTimeZone } from "@/lib/format";
import { cn } from "@/lib/cn";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/Button";

type Scope = "upcoming" | "past";

interface CourseRef {
  id: string;
  slug: string;
  title: string;
  isMentor: boolean;
}

export default function MeetingsView() {
  const [scope, setScope] = useState<Scope>("upcoming");
  const [meetings, setMeetings] = useState<MeetingRow[] | null>(null);
  const [coursesById, setCoursesById] = useState<Map<string, CourseRef>>(new Map());
  const [error, setError] = useState<string | null>(null);
  const [tz] = useState(localTimeZone());

  const load = useCallback(async () => {
    setError(null);
    try {
      const mine = await apiGet<MyCourses>("/courses/mine");
      const map = new Map<string, CourseRef>();
      for (const l of mine.learning) map.set(l.course.id, { id: l.course.id, slug: l.course.slug, title: l.course.title, isMentor: false });
      for (const m of mine.mentoring) map.set(m.course.id, { id: m.course.id, slug: m.course.slug, title: m.course.title, isMentor: true });
      setCoursesById(map);

      const ids = [...map.keys()];
      if (ids.length === 0) {
        setMeetings([]);
        return;
      }

      const perCourse = await Promise.all(
        ids.map((courseId) =>
          Promise.all(
            (["upcoming", "past"] as Scope[]).map((s) =>
              apiGet<{ meetings: MeetingRow[] }>(`/courses/${courseId}/meetings`, { scope: s }).catch(() => ({ meetings: [] as MeetingRow[] })),
            ),
          ).then(([up, past]) => [...up.meetings, ...past.meetings]),
        ),
      );
      setMeetings(perCourse.flat());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your meetings.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!meetings) return <Spinner label="Loading meetings…" />;

  const now = Date.now();
  const filtered = meetings
    .filter((m) => (scope === "upcoming" ? new Date(m.scheduledAt).getTime() >= now : new Date(m.scheduledAt).getTime() < now))
    .sort((a, b) =>
      scope === "upcoming"
        ? new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        : new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
    );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Meetings</h1>
          <p className="mt-1 text-sm text-slate-500">
            Your live sessions. Times shown in <span className="font-medium text-ink-700">{tz}</span>.
          </p>
        </div>
        <div role="tablist" aria-label="Meeting scope" className="flex gap-1">
          {(["upcoming", "past"] as Scope[]).map((s) => (
            <button
              key={s}
              type="button"
              role="tab"
              aria-selected={scope === s}
              onClick={() => setScope(s)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold capitalize",
                scope === s ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      {filtered.length === 0 ? (
        <EmptyState
          title={`No ${scope} meetings`}
          description="Sessions scheduled for your courses will appear here."
        />
      ) : (
        <ul className="flex flex-col divide-y divide-slate-200 rounded-[20px] border border-slate-200 bg-white">
          {filtered.map((m) => {
            const course = coursesById.get(m.course.id) ?? { id: m.course.id, slug: m.course.slug, title: m.course.title, isMentor: false };
            return (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
                <div className="min-w-0">
                  <p className="font-semibold text-ink-900">{m.title}</p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {formatDate(m.scheduledAt)} · {m.durationMin} min
                  </p>
                  <p className="mt-0.5 text-sm">
                    <Link href={`/dashboard/courses/${course.slug}`} className="text-brand-700 hover:underline">
                      {course.title}
                    </Link>
                    {m.topic?.title && <span className="text-slate-400"> · {m.topic.title}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {course.isMentor && (
                    <Link href={`/dashboard/mentor/courses/${course.slug}`} className={buttonClass("ghost", "sm")}>
                      Manage
                    </Link>
                  )}
                  <a
                    href={m.meetingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonClass("secondary", "sm")}
                  >
                    Join
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
