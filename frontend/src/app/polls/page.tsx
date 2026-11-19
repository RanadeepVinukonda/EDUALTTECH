import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ArrowForward from "@mui/icons-material/ArrowForward";
import HowToVote from "@mui/icons-material/HowToVote";
import EmojiEvents from "@mui/icons-material/EmojiEvents";
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
    <div className="min-h-screen bg-paper">
      {/* Compact Dot-Grid Arena Masthead */}
      <section
        className="border-b border-rule bg-paper-2"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15, 32, 39, 0.06) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      >
        <div className={`${wrap} py-10 sm:py-12`}>
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex items-center gap-1.5 text-xs text-muted sm:text-sm">
              <li>
                <Link href="/" className="transition-colors hover:text-ink">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-muted/70">
                <ChevronRight fontSize="small" />
              </li>
              <li className="font-medium text-ink" aria-current="page">
                Course Polling
              </li>
            </ol>
          </nav>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-mono font-semibold uppercase tracking-[0.12em] text-[#025926]">
                <HowToVote sx={{ fontSize: 14 }} aria-hidden />
                <span>Live Community Ballot</span>
              </div>
              <h1 className="mt-3 font-display text-display-s font-semibold leading-[1.06] tracking-tight text-ink">
                Shape the next syllabus.
              </h1>
              <p className="mt-3 text-base leading-relaxed text-ink-2 sm:text-lg">
                Compare the proposals head-to-head and cast your verified vote. The winning course gets built, staffed with mentors, and launched first.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold text-ink-2">
              <span className="rounded-xl border border-rule bg-[#ffffff] px-3.5 py-2 shadow-elev1">
                1 verified vote / account
              </span>
              <Link
                href="#past-polls"
                className="inline-flex items-center gap-1.5 rounded-xl border border-rule bg-[#ffffff] px-3.5 py-2 text-[#025926] shadow-elev1 transition hover:border-brand-300 hover:bg-brand-50"
              >
                Past winners
                <ArrowForward sx={{ fontSize: 14 }} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Head-to-Head Showdown Ballot Arena */}
      <CommunityCoursePoll />

      {/* Past Poll Winners Trophy Shelf */}
      <section id="past-polls" className="scroll-mt-16 border-t border-rule bg-paper-2 py-12 sm:py-16">
        <div className={wrap}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.12em] text-brand-700">
                Trophy Shelf · Past Cycles
              </p>
              <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                Past poll results and prioritized courses
              </h2>
            </div>
            <p className="max-w-md text-sm text-ink-2">
              Community proposals that won earlier voting rounds and launched as mentor-led courses.
            </p>
          </div>

          {closedPolls.length === 0 ? (
            <div className="mt-7 flex flex-col gap-5 rounded-2xl border border-rule bg-[#ffffff] p-6 shadow-elev1 sm:flex-row sm:items-center sm:justify-between sm:p-7">
              <div className="flex items-start gap-4">
                <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-800">
                  <EmojiEvents fontSize="small" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-ink sm:text-lg">
                    This is our inaugural course demand cycle!
                  </h3>
                  <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-2">
                    Once the active showdown above concludes, the winning proposal and its resulting course will be recorded here.
                  </p>
                </div>
              </div>
              <Link
                href="/courses"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-[#025926] px-4 text-xs font-semibold text-white transition hover:bg-brand-800"
              >
                Explore live courses
                <ArrowForward sx={{ fontSize: 15 }} aria-hidden />
              </Link>
            </div>
          ) : (
            <div className="mt-7 grid gap-6 lg:grid-cols-2">
              {closedPolls.map((poll) => {
                const totalVotes = poll.options.reduce((acc, o) => acc + o.votes, 0);
                const winner = poll.options.find((o) => o.isWinningOption) || poll.options[0];

                return (
                  <div
                    key={poll.id}
                    className="overflow-hidden rounded-2xl border border-rule bg-[#ffffff] p-6 shadow-elev1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rule pb-4">
                      <div>
                        <span className="rounded-full border border-rule bg-paper-2 px-2.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-wider text-muted">
                          Closed poll
                        </span>
                        <h3 className="mt-2 font-display text-lg font-semibold text-ink">{poll.title}</h3>
                      </div>
                      <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 font-mono text-xs font-semibold text-brand-800">
                        {totalVotes.toLocaleString()} votes
                      </span>
                    </div>

                    {winner && (
                      <div className="mt-4 flex flex-col justify-between gap-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4 sm:flex-row sm:items-center">
                        <div>
                          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-[#025926]">
                            Winning proposal
                          </p>
                          <p className="mt-1 font-display text-base font-semibold text-ink">{winner.title}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-ink-2">{winner.description}</p>
                        </div>
                        {winner.convertedCourseId && (
                          <Link
                            href="/courses"
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#025926] px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-800"
                          >
                            View course
                            <ArrowForward sx={{ fontSize: 14 }} aria-hidden />
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
