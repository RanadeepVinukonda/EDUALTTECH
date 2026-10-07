import Link from "next/link";
import type { RoadmapChapter, RoadmapShell } from "@/components/courses/CourseRoadmap";

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
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
