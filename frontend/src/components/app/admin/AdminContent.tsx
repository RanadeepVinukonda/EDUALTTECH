"use client";

import { useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import type { AdminCourseSummary, Roadmap } from "@/lib/app-types";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { AdminHeader, Panel, Skeleton, StatusPill, statusTone, useAsync, useDebouncedValue } from "./admin-ui";

export default function AdminContent() {
  const [q, setQ] = useState("");
  const debounced = useDebouncedValue(q);
  const [selected, setSelected] = useState<AdminCourseSummary | null>(null);
  const courses = useAsync(
    () => apiGet<{ courses: AdminCourseSummary[] }>("/admin/courses", { q: debounced || undefined, limit: 20 }),
    [debounced],
  );

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Content oversight"
        description="Inspect course content structure and publication state. Courses are the only content type with backend-wide moderation states."
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <Panel title="Courses">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses…"
            aria-label="Search courses"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
          />
          <div className="mt-3 max-h-[520px] overflow-y-auto">
            {courses.error ? (
              <ErrorState message={courses.error} onRetry={courses.reload} />
            ) : courses.loading && !courses.data ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 rounded-lg" />
                ))}
              </div>
            ) : courses.data && courses.data.courses.length > 0 ? (
              <ul className="divide-y divide-slate-100">
                {courses.data.courses.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(c)}
                      aria-pressed={selected?.id === c.id}
                      className={`w-full px-1 py-2.5 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 ${
                        selected?.id === c.id ? "bg-brand-50" : ""
                      }`}
                    >
                      <span className="block truncate font-semibold text-ink-900">{c.title}</span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <StatusPill tone={statusTone(c.status)}>{c.status.toLowerCase()}</StatusPill>
                        <span className="text-xs text-slate-500">{c._count.chapters} chapters</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-slate-500">No courses found.</p>
            )}
          </div>
        </Panel>

        <Panel
          title={selected ? `Content — ${selected.title}` : "Content"}
          description={selected ? undefined : "Select a course to inspect its chapters, topics and lessons."}
          actions={
            selected ? (
              <Link href={`/dashboard/admin/courses/${selected.id}/roadmap`} className="text-sm font-semibold text-brand-700 hover:underline">
                Edit in roadmap builder →
              </Link>
            ) : undefined
          }
        >
          {selected ? <ContentTree courseId={selected.id} /> : <p className="py-10 text-center text-sm text-slate-500">No course selected.</p>}
        </Panel>
      </div>

      <p className="text-sm text-slate-500">
        Lessons and resources are not exposed through a backend-wide admin listing — only per-course, via the roadmap
        endpoint. There is no moderation queue or approval workflow for content.
      </p>
    </div>
  );
}

function ContentTree({ courseId }: { courseId: string }) {
  const roadmap = useAsync(() => apiGet<Roadmap>(`/courses/${courseId}/roadmap`), [courseId]);

  if (roadmap.error) return <ErrorState message={roadmap.error} onRetry={roadmap.reload} />;
  if (roadmap.loading && !roadmap.data) return <Skeleton className="h-72 rounded-xl" />;
  const chapters = roadmap.data?.chapters ?? [];
  if (chapters.length === 0) return <EmptyState title="No content yet" description="This course has no chapters. Add them in the roadmap builder." />;

  return (
    <ol className="space-y-4">
      {chapters.map((ch) => (
        <li key={ch.id}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display font-bold text-ink-900">
              {ch.order}. {ch.title}
            </h3>
            <span className="text-xs text-slate-500">{ch.topics.length} topics</span>
          </div>
          <ul className="mt-2 space-y-2 border-l-2 border-slate-100 pl-4">
            {ch.topics.map((t) => (
              <li key={t.id}>
                <p className="text-sm font-semibold text-ink-700">
                  {t.order}. {t.title}
                </p>
                {t.lessons.length > 0 ? (
                  <ul className="mt-1 space-y-1">
                    {t.lessons.map((l) => (
                      <li key={l.id} className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold uppercase text-slate-600">{l.type}</span>
                        <span className="truncate">{l.title}</span>
                        <StatusPill tone={l.isPublished ? "success" : "neutral"}>{l.isPublished ? "published" : "draft"}</StatusPill>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-1 text-xs text-slate-400">No lessons.</p>
                )}
              </li>
            ))}
            {ch.topics.length === 0 && <li className="text-xs text-slate-400">No topics.</li>}
          </ul>
        </li>
      ))}
    </ol>
  );
}
