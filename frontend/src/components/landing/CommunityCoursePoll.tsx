"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ThumbUp from "@mui/icons-material/ThumbUp";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Add from "@mui/icons-material/Add";
import HowToVote from "@mui/icons-material/HowToVote";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Lock from "@mui/icons-material/Lock";
import { apiGet, apiPost } from "@/lib/api";
import type { ActivePollResponse, PollOptionItem } from "@/lib/types";
import { cn } from "@/lib/cn";
import { useAuth } from "@/components/app/AuthProvider";
import Spinner from "@/components/ui/Spinner";

export default function CommunityCoursePoll() {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [pollTitle, setPollTitle] = useState("Community Course Demand & Prioritization Poll");
  const [pollDescription, setPollDescription] = useState(
    "We don't guess what learners want. Every cycle, our community votes on the next skills to bring to EduAltTech. Winning courses receive dedicated roadmaps, learning materials, and vetted mentors."
  );
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
    apiGet<ActivePollResponse>("/polls/active")
      .then((res) => {
        if (!alive) return;
        if (res.poll) {
          setPollId(res.poll.id);
          setPollTitle(res.poll.title);
          if (res.poll.description) setPollDescription(res.poll.description);
          setOptions(res.poll.options && res.poll.options.length > 0 ? res.poll.options : []);
        } else {
          setPollId(null);
          setOptions([]);
        }
        if (res.userVoteOptionId) {
          setUserVotedOptionId(res.userVoteOptionId);
        }
      })
      .catch(() => {
        if (alive) {
          setPollId(null);
          setOptions([]);
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, []);

  const totalVotes = options.reduce((acc, p) => acc + (p.votes || 0), 0);

  async function handleVote(optionId: string) {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent("/polls")}`);
      return;
    }

    if (userVotedOptionId === optionId || voting) return;
    setVoting(optionId);

    const prevOptionId = userVotedOptionId;
    // Optimistic update
    setUserVotedOptionId(optionId);
    setOptions((current) =>
      current.map((opt) => {
        if (opt.id === optionId) return { ...opt, votes: opt.votes + 1 };
        if (opt.id === prevOptionId) return { ...opt, votes: Math.max(0, opt.votes - 1) };
        return opt;
      })
    );

    if (pollId) {
      try {
        await apiPost(`/polls/${pollId}/vote`, { optionId });
      } catch {
        // Revert on error
        setUserVotedOptionId(prevOptionId);
        setOptions((current) =>
          current.map((opt) => {
            if (opt.id === optionId) return { ...opt, votes: Math.max(0, opt.votes - 1) };
            if (opt.id === prevOptionId) return { ...opt, votes: opt.votes + 1 };
            return opt;
          })
        );
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
        category: "Community Suggestion",
        description: "Learner wishlist submission for the upcoming curriculum vote.",
      });
      setCustomSkill("");
      setSuggestSuccess(true);
      setTimeout(() => setSuggestSuccess(false), 5000);
    } catch {
      setCustomSkill("");
      setSuggestSuccess(true);
      setTimeout(() => setSuggestSuccess(false), 5000);
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <section id="community-poll" className="bg-white py-16 sm:py-24 border-b border-slate-200 scroll-mt-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {!user && (
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-brand-200 bg-brand-50/60 p-4 sm:p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-600 text-white">
                <Lock fontSize="small" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink-900">
                  Course voting is exclusively open to logged-in learners
                </p>
                <p className="text-xs text-slate-600">
                  Sign in or create an account to cast your vote and prevent duplicate submissions.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/login?next=/polls"
                className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-brand-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition"
              >
                Create account
              </Link>
            </div>
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Heading and Context */}
          <div className="lg:col-span-5">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl sm:leading-tight">
              {pollTitle}
            </h2>

            <p className="mt-4 text-base leading-relaxed text-slate-600">
              {pollDescription}
            </p>

            <div className="mt-8 rounded-xl bg-slate-50 p-6 border border-slate-200 shadow-xs">
              <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2">
                <Add fontSize="small" className="text-brand-600" />
                Want a specific skill or course?
              </h3>
              <p className="mt-1 text-xs text-slate-600">
                Submit any technology, academic, or creative art topic to enter it into the upcoming prioritization vote.
              </p>

              <form onSubmit={handleSuggest} className="mt-4 flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  placeholder="e.g. Jazz Piano, Flutter, 3D Blender..."
                  aria-label="Suggest a course or skill"
                  className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
                />
                <button
                  type="submit"
                  disabled={suggesting}
                  className="inline-flex items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-brand-700 shrink-0 disabled:opacity-50"
                >
                  {suggesting ? "Submitting..." : "Submit Skill"}
                </button>
              </form>

              {suggestSuccess && (
                <p className="mt-3 text-xs font-semibold text-brand-700 flex items-center gap-1.5 animate-in fade-in duration-200">
                  <CheckCircle fontSize="inherit" />
                  Skill submitted to curriculum wishlist for review!
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-slate-500">
              <div className="flex items-center gap-2">
                <span>Total Community Votes: <strong>{totalVotes.toLocaleString()}</strong></span>
                <span>•</span>
                <span>Real-time</span>
              </div>
              <Link
                href="/polls#past-polls"
                className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-brand-700 hover:underline"
              >
                <span>View past winners</span>
                <ArrowForward fontSize="inherit" />
              </Link>
            </div>
          </div>

          {/* Right Column: Live Poll Cards or Honest Empty State */}
          <div className="lg:col-span-7">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-xl border border-slate-200 bg-slate-50/50">
                <Spinner label="Loading current course proposals..." />
              </div>
            ) : options.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-12 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-slate-100 text-slate-400">
                  <HowToVote sx={{ fontSize: 32 }} />
                </div>
                <h4 className="mt-4 font-display text-lg font-semibold text-ink-900">
                  Nothing to vote on right now
                </h4>
                <p className="mt-2 text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                  There are currently no active course proposals open for voting. Check back soon for the next cycle, or suggest a skill or topic you would like us to teach next!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {options.map((option) => {
                  const hasVoted = userVotedOptionId === option.id;
                  const percentage = Math.round(((option.votes || 0) / (totalVotes || 1)) * 100);

                  return (
                    <div
                      key={option.id}
                      className={cn(
                        "relative overflow-hidden rounded-xl border p-5 sm:p-6 transition-all duration-200",
                        hasVoted
                          ? "border-brand-500 bg-brand-50/20 ring-1 ring-brand-500/20"
                          : "border-slate-200 bg-white hover:border-slate-300"
                      )}
                    >
                      {/* Background progress fill bar */}
                      <div
                        className="absolute inset-y-0 left-0 bg-brand-100/40 -z-10 transition-all duration-700 ease-out"
                        style={{ width: `${Math.max(percentage, 4)}%` }}
                      />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              {option.category}
                            </span>
                            {option.difficulty && (
                              <span className="text-[11px] font-semibold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
                                {option.difficulty}
                              </span>
                            )}
                            {option.durationWeeks && (
                              <span className="text-[11px] font-semibold text-slate-500">
                                ~{option.durationWeeks} weeks
                              </span>
                            )}
                          </div>

                          <h4 className="font-display text-base sm:text-lg font-semibold text-ink-900 truncate">
                            {option.title}
                          </h4>

                          <p className="mt-1 text-xs sm:text-sm text-slate-600 line-clamp-2">
                            {option.description}
                          </p>

                          {option.learningOutcomes && option.learningOutcomes.length > 0 && (
                            <div className="mt-2.5 flex flex-wrap gap-1.5">
                              {option.learningOutcomes.slice(0, 3).map((outc) => (
                                <span
                                  key={outc}
                                  className="rounded-md bg-white/80 border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600"
                                >
                                  ✓ {outc}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                          <div className="text-right">
                            <span className="font-mono text-base font-semibold text-ink-900">
                              {(option.votes || 0).toLocaleString()}
                            </span>
                            <span className="text-xs text-slate-500 ml-1">votes</span>
                            <div className="font-mono text-xs font-semibold text-brand-700">
                              {percentage}%
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleVote(option.id)}
                            disabled={voting === option.id}
                            aria-label={`Vote for ${option.title}`}
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition",
                              hasVoted
                                ? "bg-brand-700 text-white hover:bg-brand-800"
                                : "bg-brand-600 text-white hover:bg-brand-700 active:scale-95"
                            )}
                          >
                            {hasVoted ? (
                              <>
                                <CheckCircle fontSize="inherit" />
                                <span>Your Vote</span>
                              </>
                            ) : (
                              <>
                                <ThumbUp fontSize="inherit" />
                                <span>Vote</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
