import Link from "next/link";
import type { RoadmapChapter, RoadmapShell } from "@/components/courses/CourseRoadmap";

const TYPE_LABEL: Record<string, string> = {
  VIDEO: "Recorded class",
  READING: "Reading / notes",
  QUIZ: "Quiz",
  ASSIGNMENT: "Assignment",
};

const TYPE_DOT: Record<string, string> = {
  VIDEO: "bg-sky-500",
  READING: "bg-slate-400",
  QUIZ: "bg-violet-500",
  ASSIGNMENT: "bg-brand-600",
};

function ChipLink({ href, children, solid = false }: { href: string; children: React.ReactNode; solid?: boolean }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        solid
          ? "rounded-[10px] bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          : "rounded-[10px] border-[1.5px] border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50"
      }
    >
      {children}
    </Link>
  );
}

/**
 * Admin read-only structure map: numbered chapter nodes on a vertical rail,
 * every lesson and concept visible — no accordions, no authoring actions.
 */
export default function CourseStructureMap({
  chapters,
  roadmap,
}: {
  chapters: RoadmapChapter[];
  roadmap: RoadmapShell | null;
}) {
  const lessonCount = chapters.reduce((n, c) => n + c.modules.length, 0);
  const conceptCount = chapters.reduce(
    (n, c) => n + c.modules.reduce((m, mod) => m + mod.lessons.length, 0),
    0,
  );

  return (
    <div>
      {roadmap?.title && (
        <div className="rounded-2xl border border-brand-100 bg-brand-50/60 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">Course roadmap</p>
          <h3 className="font-display text-lg font-semibold text-slate-900">{roadmap.title}</h3>
          {roadmap.summary && <p className="mt-1 text-sm text-slate-600">{roadmap.summary}</p>}
          {(roadmap.meetingUrl || roadmap.recordingUrl) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {roadmap.meetingUrl && <ChipLink href={roadmap.meetingUrl} solid>Live class link</ChipLink>}
              {roadmap.recordingUrl && <ChipLink href={roadmap.recordingUrl}>Recording link</ChipLink>}
            </div>
          )}
          {(roadmap.resources?.length ?? 0) > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {roadmap.resources!.map((r) => (
                <li key={r.url}>
                  <ChipLink href={r.url}>{r.label}</ChipLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {chapters.length} chapter{chapters.length === 1 ? "" : "s"} · {lessonCount} lesson
        {lessonCount === 1 ? "" : "s"} · {conceptCount} concept{conceptCount === 1 ? "" : "s"}
      </p>

      {chapters.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-400">
          No chapters published yet.
        </div>
      ) : (
        <ol className="relative mt-6 space-y-6 before:absolute before:bottom-3 before:left-[17px] before:top-3 before:w-px before:bg-slate-200 before:content-['']">
          {chapters.map((c, i) => (
            <li key={c.id} className="relative pl-12">
              <span className="absolute left-0 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full border-2 border-brand-500 bg-white text-xs font-bold text-brand-700">
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-elev1">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Chapter {c.order}</p>
                    <h3 className="font-display text-lg font-bold text-slate-900">{c.title}</h3>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                    {c.modules.length} lesson{c.modules.length === 1 ? "" : "s"}
                  </span>
                </div>
                {c.summary && <p className="mt-1.5 text-sm text-slate-600">{c.summary}</p>}

                {(c.meetingUrl || c.recordingUrl || c.resources.length > 0) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {c.meetingUrl && <ChipLink href={c.meetingUrl} solid>Live class</ChipLink>}
                    {c.recordingUrl && <ChipLink href={c.recordingUrl}>Recording</ChipLink>}
                    {c.resources.map((r) => (
                      <ChipLink key={r.url} href={r.url}>{r.label}</ChipLink>
                    ))}
                  </div>
                )}

                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Lessons</p>
                  {c.modules.length === 0 ? (
                    <p className="mt-2 text-sm text-slate-400">No lessons here yet.</p>
                  ) : (
                    <ul className="mt-2 space-y-3">
                      {c.modules.map((mod) => (
                        <li key={mod.id}>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                            <span className="text-xs font-semibold text-slate-400">{mod.position}.</span>
                            <span className="text-sm font-semibold text-slate-800">{mod.title}</span>
                            <span className="text-xs text-slate-400">
                              {mod.lessons.length} concept{mod.lessons.length === 1 ? "" : "s"}
                            </span>
                          </div>

                          {mod.lessons.length > 0 && (
                            <ul className="mt-1.5 space-y-1 border-l-2 border-slate-100 pl-4">
                              {mod.lessons.map((l) => (
                                <li key={l.id} className="flex flex-wrap items-center gap-x-2.5 gap-y-1 py-0.5">
                                  <span className={`h-2 w-2 shrink-0 rounded-full ${TYPE_DOT[l.type] ?? "bg-slate-400"}`} />
                                  <span className="text-sm text-slate-700">{l.title}</span>
                                  <span className="text-xs text-slate-400">{TYPE_LABEL[l.type] ?? l.type}</span>
                                  {(l.resources?.length ?? 0) > 0 && (
                                    <span className="text-xs font-medium text-brand-700">
                                      {l.resources!.length} resource{l.resources!.length === 1 ? "" : "s"}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
