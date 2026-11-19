"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThumbUp from "@mui/icons-material/ThumbUp";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Add from "@mui/icons-material/Add";
import HowToVote from "@mui/icons-material/HowToVote";
import Lock from "@mui/icons-material/Lock";
import { apiGet, apiPost, ApiError } from "@/lib/api";
import type { ActivePollResponse, PollOptionItem } from "@/lib/types";
import { notifyError, notifySuccess } from "@/lib/notify";
import { cn } from "@/lib/cn";
import { useAuth } from "@/components/app/AuthProvider";
import Spinner from "@/components/ui/Spinner";

const QUICK_IDEAS = [
  "AI Agents",
  "Flutter Apps",
  "3D Blender",
  "Music Production",
  "Embedded Robotics",
  "UI/UX Systems",
];

export default function CommunityCoursePoll() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [pollTitle, setPollTitle] = useState("");
  const [pollDescription, setPollDescription] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [pollId, setPollId] = useState<string | null>(null);
  const [options, setOptions] = useState<PollOptionItem[]>([]);
  const [userVotedOptionId, setUserVotedOptionId] = useState<string | null>(null);
  const [voting, setVoting] = useState<string | null>(null);
  const [customSkill, setCustomSkill] = useState("");
  const [suggestSuccess, setSuggestSuccess] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setLoadError(null);
    apiGet<ActivePollResponse>("/polls/active")
      .then((res) => {
        if (!alive) return;
        if (res.poll) {
          setPollId(res.poll.id);
          setPollTitle(res.poll.title);
          setPollDescription(res.poll.description ?? "");
          setOptions(res.poll.options && res.poll.options.length > 0 ? res.poll.options : []);
        } else {
          setPollId(null);
          setPollTitle("");
          setPollDescription("");
          setOptions([]);
        }
        setUserVotedOptionId(res.userVoteOptionId ?? null);
      })
      .catch((err: unknown) => {
        if (alive) {
          setPollId(null);
          setPollTitle("");
          setPollDescription("");
          setOptions([]);
          setUserVotedOptionId(null);
          setLoadError(err instanceof ApiError ? err.message : "Could not load course proposals.");
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const totalVotes = options.reduce((acc, p) => acc + (p.votes || 0), 0);
  const isHeadToHead = options.length === 2;
  const firstPct =
    isHeadToHead && totalVotes > 0 ? Math.round(((options[0].votes || 0) / totalVotes) * 100) : 50;
  const secondPct = isHeadToHead ? 100 - firstPct : 50;

  async function handleVote(optionId: string) {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent("/polls")}`);
      return;
    }

    if (userVotedOptionId === optionId || voting) return;
    setVoting(optionId);

    const prevOptionId = userVotedOptionId;
    setUserVotedOptionId(optionId);
    setOptions((current) =>
      current.map((opt) => {
        if (opt.id === optionId) return { ...opt, votes: opt.votes + 1 };
        if (opt.id === prevOptionId) return { ...opt, votes: Math.max(0, opt.votes - 1) };
        return opt;
      }),
    );

    if (pollId) {
      try {
        await apiPost(`/polls/${pollId}/vote`, { optionId });
      } catch (err) {
        setUserVotedOptionId(prevOptionId);
        setOptions((current) =>
          current.map((opt) => {
            if (opt.id === optionId) return { ...opt, votes: Math.max(0, opt.votes - 1) };
            if (opt.id === prevOptionId) return { ...opt, votes: opt.votes + 1 };
            return opt;
          }),
        );
        notifyError(err instanceof ApiError ? err.message : "Could not record your vote. Try again.");
      } finally {
        setVoting(null);
      }
    } else {
      setVoting(null);
    }
  }

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault();
    if (!customSkill.trim() || suggesting) return;
    setSuggesting(true);

    try {
      await apiPost("/polls/suggest", {
        title: customSkill.trim(),
      });
      setCustomSkill("");
      setSuggestSuccess(true);
      notifySuccess("Suggestion submitted for curriculum review.");
      setTimeout(() => setSuggestSuccess(false), 5000);
    } catch (err) {
      notifyError(err instanceof ApiError ? err.message : "Could not submit your suggestion. Please try again.");
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <section id="community-poll" className="scroll-mt-12 bg-paper py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Logged-out Account Notice */}
        {!user && (
          <div className="mb-8 flex flex-col justify-between gap-4 rounded-2xl border border-ink-200/80 bg-[#024059] p-5 text-white shadow-elev2 sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-start gap-3.5 sm:items-center">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 text-white">
                <Lock fontSize="small" />
              </span>
              <div>
                <p className="font-display text-sm font-semibold text-white sm:text-base">
                  Sign in to cast your verified vote
                </p>
                <p className="mt-0.5 text-xs text-white/80">
                  Voting is restricted to logged-in learner accounts so every voice counts once.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2.5">
              <Link
                href="/login?next=/polls"
                className="inline-flex h-10 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-10 items-center justify-center rounded-xl bg-[#038c3e] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#026b2f]"
              >
                Create account
              </Link>
            </div>
          </div>
        )}

        {/* Active Showdown Question & Live Tug-of-War Meter */}
        {(pollTitle || pollDescription) && !loading && !loadError && options.length > 0 && (
          <div className="mb-8 rounded-3xl border border-rule bg-[#ffffff] p-6 shadow-elev1 sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-[0.12em] text-[#025926]">
                  <span className="h-2 w-2 rounded-full bg-[#038c3e]" aria-hidden="true" />
                  Current Showdown
                </div>
                {pollTitle && (
                  <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
                    {pollTitle}
                  </h2>
                )}
                {pollDescription && (
                  <p className="mt-2 text-sm leading-relaxed text-ink-2 sm:text-base">
                    {pollDescription}
                  </p>
                )}
              </div>

              <div className="shrink-0 rounded-2xl border border-rule bg-paper px-5 py-3 text-left lg:text-right">
                <span className="block font-mono text-[10.5px] font-semibold uppercase tracking-wider text-muted">
                  Total Votes Cast
                </span>
                <span className="mt-0.5 block font-mono text-2xl font-bold text-ink">
                  {totalVotes.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Live Head-to-Head Tug-of-War Bar (for 2-option showdowns) */}
            {isHeadToHead && (
              <div className="mt-6 border-t border-rule pt-5">
                <div className="mb-2 flex items-center justify-between gap-4 text-xs font-semibold">
                  <span className="truncate text-[#025926]">
                    01 · {options[0].title} ({totalVotes > 0 ? `${firstPct}%` : "0%"})
                  </span>
                  <span className="truncate text-right text-[#024059]">
                    ({totalVotes > 0 ? `${secondPct}%` : "0%"}) {options[1].title} · 02
                  </span>
                </div>
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-paper-2 p-0.5">
                  <div
                    className="h-full rounded-l-full bg-[#025926] transition-all duration-500"
                    style={{ width: `${totalVotes > 0 ? firstPct : 50}%` }}
                  />
                  <div className="w-0.5 shrink-0 bg-[#ffffff]" />
                  <div
                    className="h-full rounded-r-full bg-[#024059] transition-all duration-500"
                    style={{ width: `${totalVotes > 0 ? secondPct : 50}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Side-by-Side Full-Width Ballot Cards */}
        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-rule bg-[#ffffff] py-16 shadow-elev1">
            <Spinner label="Loading current course proposals..." />
          </div>
        ) : loadError ? (
          <div role="alert" className="rounded-3xl border border-rule bg-[#ffffff] p-8 text-center shadow-elev1">
            <h3 className="font-display text-lg font-semibold text-ink">Course proposals could not be loaded</h3>
            <p className="mt-2 text-sm text-ink-2">{loadError}</p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-5 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-xl border border-rule bg-paper px-4 py-2 text-sm font-semibold text-ink transition hover:bg-paper-2"
            >
              Try again
            </button>
          </div>
        ) : options.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-rule bg-[#ffffff] p-12 text-center shadow-elev1">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-paper-2 text-muted">
              <HowToVote sx={{ fontSize: 32 }} />
            </div>
            <h4 className="mt-4 font-display text-lg font-semibold text-ink">
              Nothing to vote on right now
            </h4>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-2">
              There are currently no active course proposals open for voting. Suggest a skill or topic below for the next cycle!
            </p>
          </div>
        ) : (
          <div className="relative">
            {isHeadToHead && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-rule bg-[#ffffff] font-mono text-xs font-extrabold tracking-wider text-ink shadow-elev2 md:flex"
              >
                VS
              </div>
            )}

            <div
              className={cn(
                "grid gap-6",
                isHeadToHead ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3",
              )}
            >
              {options.map((option, index) => {
                const hasVoted = userVotedOptionId === option.id;
                const percentage =
                  totalVotes > 0 ? Math.round(((option.votes || 0) / totalVotes) * 100) : 0;
                const isAltBrand = index % 2 === 1;

                return (
                  <article
                    key={option.id}
                    className={cn(
                      "flex flex-col overflow-hidden rounded-3xl border-2 bg-[#ffffff] shadow-elev1 transition-all duration-200 hover:-translate-y-1 hover:shadow-elev2",
                      hasVoted
                        ? isAltBrand
                          ? "border-[#024059] ring-4 ring-[#024059]/10"
                          : "border-[#025926] ring-4 ring-[#025926]/10"
                        : "border-rule hover:border-brand-300",
                    )}
                  >
                    <div className="flex flex-1 flex-col p-6 sm:p-8">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-lg px-2.5 py-1 font-mono text-[11px] font-bold text-white",
                              isAltBrand ? "bg-[#024059]" : "bg-[#025926]",
                            )}
                          >
                            Candidate {String(index + 1).padStart(2, "0")}
                          </span>
                          {option.difficulty && (
                            <span className="rounded-full border border-rule bg-paper-2 px-2.5 py-0.5 text-xs font-semibold text-ink-2">
                              {option.difficulty}
                            </span>
                          )}
                        </div>

                        <div className="text-right font-mono">
                          <span className="text-xl font-bold text-ink">{percentage}%</span>
                          <span className="ml-1.5 text-xs text-muted">
                            ({(option.votes || 0).toLocaleString()} votes)
                          </span>
                        </div>
                      </div>

                      {option.category && option.category !== "General" && (
                        <p className="mt-4 font-mono text-[11px] font-semibold uppercase tracking-wider text-muted">
                          {option.category}
                          {option.durationWeeks ? ` · ~${option.durationWeeks} weeks` : ""}
                        </p>
                      )}

                      <h3 className="mt-1.5 font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">
                        {option.title}
                      </h3>

                      <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-2 sm:text-base">
                        {option.description}
                      </p>

                      {option.learningOutcomes && option.learningOutcomes.length > 0 && (
                        <ul className="mt-5 space-y-1.5 border-t border-rule pt-4 text-xs text-ink-2">
                          {option.learningOutcomes.slice(0, 4).map((outc) => (
                            <li key={outc} className="flex items-start gap-2">
                              <CheckCircle
                                sx={{ fontSize: 15 }}
                                className={cn("mt-0.5 shrink-0", isAltBrand ? "text-[#024059]" : "text-[#038c3e]")}
                                aria-hidden
                              />
                              <span>{outc}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Progress Bar + Full-Width Vote Button */}
                      <div className="mt-6 pt-2">
                        <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-paper-2">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-500 ease-out",
                              isAltBrand ? "bg-[#024059]" : "bg-[#038c3e]",
                            )}
                            style={{ width: `${Math.max(percentage, totalVotes > 0 ? 3 : 0)}%` }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleVote(option.id)}
                          disabled={voting === option.id}
                          aria-label={`Vote for ${option.title}`}
                          className={cn(
                            "inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60",
                            hasVoted
                              ? "bg-ink text-white"
                              : isAltBrand
                                ? "bg-[#024059] hover:bg-ink-800"
                                : "bg-[#025926] hover:bg-brand-800",
                          )}
                        >
                          {hasVoted ? (
                            <>
                              <CheckCircle sx={{ fontSize: 18 }} aria-hidden />
                              <span>Voted for Candidate {String(index + 1).padStart(2, "0")}</span>
                            </>
                          ) : (
                            <>
                              <ThumbUp sx={{ fontSize: 17 }} aria-hidden />
                              <span>Vote for this course</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        {/* Full-Width Horizontal "Pitch a Course Idea" Studio Strip */}
        <div className="mt-10 rounded-3xl border border-rule bg-paper-2 p-6 sm:p-8">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-5">
              <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink sm:text-xl">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-[#025926] text-white">
                  <Add fontSize="small" />
                </span>
                Pitch a course for the next ballot
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">
                Want a technology, academic, or creative topic that isn&apos;t listed? Send it in — top community requests enter the next voting showdown.
              </p>
            </div>

            <div className="lg:col-span-7">
              <div className="mb-3 flex flex-wrap gap-1.5">
                {QUICK_IDEAS.map((idea) => (
                  <button
                    key={idea}
                    type="button"
                    onClick={() => setCustomSkill(idea)}
                    className="cursor-pointer rounded-full border border-rule bg-[#ffffff] px-3 py-1 text-xs font-medium text-ink-2 shadow-elev1 transition hover:border-brand-300 hover:bg-brand-50 hover:text-[#025926]"
                  >
                    + {idea}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSuggest} className="flex flex-col gap-2.5 sm:flex-row">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder="Type a course or skill you want us to teach next…"
                  aria-label="Suggest a course or skill"
                  className="h-11 flex-1 rounded-xl border border-rule bg-[#ffffff] px-4 text-sm text-ink placeholder:text-muted focus:border-[#025926] focus:outline-none focus:ring-2 focus:ring-[#025926]/20"
                />
                <button
                  type="submit"
                  disabled={suggesting}
                  className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#025926] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-800 disabled:opacity-50"
                >
                  {suggesting ? "Submitting…" : "Submit suggestion"}
                </button>
              </form>

              {suggestSuccess && (
                <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-[#025926]">
                  <CheckCircle fontSize="inherit" />
                  Skill submitted to curriculum wishlist for review!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
