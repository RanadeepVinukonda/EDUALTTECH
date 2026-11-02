import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { publicFetch } from "@/lib/server-api";
import type { CoursePollItem } from "@/lib/types";
import CommunityCoursePoll from "@/components/landing/CommunityCoursePoll";

export const metadata: Metadata = {
  title: "Course Demand & Prioritization Polling | EduAltTech",
  description:
    "Vote on upcoming EduAltTech courses. Influence which multidisciplinary programs, technologies, and arts courses are developed, roadmapped, and staffed with vetted mentors next.",
  alternates: { canonical: "/polls" },
};

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export default async function PollsPage() {
  const historyData = await publicFetch<{ polls: CoursePollItem[] }>("/polls/history", {}, 120);
  const closedPolls = historyData?.polls ?? [];

  return (
    <div className="bg-white min-h-screen">
      {/* Header Banner */}
      <section className="border-b border-slate-200 bg-slate-50 py-12 sm:py-16">
        <div className={wrap}>
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-xs text-slate-500">
              <li>
                <Link href="/" className="hover:text-brand-700 transition">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-slate-400">
                <ChevronRight fontSize="small" />
              </li>
              <li className="text-slate-800 font-medium" aria-current="page">
                Course Polling
              </li>
            </ol>
          </nav>

          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-5xl leading-tight">
            Vote for what we should teach next
          </h1>

          <p className="mt-4 max-w-3xl text-base sm:text-lg leading-relaxed text-slate-600">
            EduAltTech builds courses directly around learner demand. When you vote for a course, our academic team
            evaluates syllabus scope, designs project roadmaps, and recruits industry-tested mentors.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-semibold text-slate-700">
              <span className="h-2 w-2 rounded-full bg-brand-600" />
              1 Vote Per Learner
            </span>
            <span>•</span>
            <span>Duplicate-safe transactional voting</span>
            <span>•</span>
            <span>Top proposals converted into live courses</span>
          </div>
        </div>
      </section>

      {/* Active Community Poll Component */}
      <CommunityCoursePoll />

      {/* Historical Polls & Winning Courses Section */}
      <section id="past-polls" className="scroll-mt-12 py-16 bg-slate-50 border-b border-slate-200">
        <div className={wrap}>
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">
            Past poll results and prioritized courses
          </h2>
          <p className="mt-2 text-sm text-slate-600 max-w-2xl">
            See which community proposals won previous voting cycles and became structured EduAltTech courses.
          </p>

          {closedPolls.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center">
              <p className="text-sm font-semibold text-ink-900">
                This is our inaugural course demand cycle!
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Once the active poll concludes, finalized winners and resulting course drafts will be cataloged here.
              </p>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              {closedPolls.map((poll) => {
                const totalVotes = poll.options.reduce((acc, o) => acc + o.votes, 0);
                const winner = poll.options.find((o) => o.isWinningOption) || poll.options[0];

                return (
                  <div
                    key={poll.id}
                    className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 "
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          Closed Cycle
                        </span>
                        <h3 className="mt-1 font-display text-lg font-semibold text-ink-900">{poll.title}</h3>
                      </div>
                      <span className="text-xs font-mono text-slate-500">
                        Total Votes: {totalVotes.toLocaleString()}
                      </span>
                    </div>

                    {winner && (
                      <div className="mt-4 rounded-xl border border-brand-200 bg-brand-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-brand-800">
                            Winning proposal
                          </p>
                          <p className="mt-1 font-display text-base font-semibold text-ink-900">{winner.title}</p>
                          <p className="text-xs text-slate-600 mt-0.5">{winner.description}</p>
                        </div>
                        {winner.convertedCourseId && (
                          <Link
                            href="/courses"
                            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-700 transition shrink-0"
                          >
                            View resulting course
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
