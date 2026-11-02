"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HowToVote from "@mui/icons-material/HowToVote";
import Add from "@mui/icons-material/Add";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Close from "@mui/icons-material/Close";
import EmojiEvents from "@mui/icons-material/EmojiEvents";
import School from "@mui/icons-material/School";
import Stop from "@mui/icons-material/Stop";
import Campaign from "@mui/icons-material/Campaign";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import type { CoursePollItem } from "@/lib/types";
import { cn } from "@/lib/cn";
import Spinner from "@/components/ui/Spinner";

interface NewOptionDraft {
  title: string;
  category: string;
  description: string;
  difficulty: string;
  durationWeeks: number;
  learningOutcomes: string;
}

export default function AdminPollsPage() {
  const [loading, setLoading] = useState(true);
  const [polls, setPolls] = useState<CoursePollItem[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<CoursePollItem | null>(null);

  // Create Poll Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [pollTitle, setPollTitle] = useState("");
  const [pollDescription, setPollDescription] = useState("");
  const [pollStartDate, setPollStartDate] = useState("");
  const [pollEndDate, setPollEndDate] = useState("");
  const [allowVoteChange, setAllowVoteChange] = useState(true);
  const [showLiveResults, setShowLiveResults] = useState(true);
  const [publishImmediately, setPublishImmediately] = useState(true);
  const [optionsDraft, setOptionsDraft] = useState<NewOptionDraft[]>([
    {
      title: "",
      category: "Computer Science",
      description: "",
      difficulty: "Intermediate",
      durationWeeks: 8,
      learningOutcomes: "Outcome 1, Outcome 2",
    },
    {
      title: "",
      category: "Creative Arts",
      description: "",
      difficulty: "Beginner",
      durationWeeks: 6,
      learningOutcomes: "Outcome 1, Outcome 2",
    },
  ]);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function loadPolls() {
    setLoading(true);
    try {
      const res = await apiGet<{ polls: CoursePollItem[] }>("/polls/admin/all");
      setPolls(res.polls || []);
      if (res.polls && res.polls.length > 0) {
        // Select active or first poll
        const active = res.polls.find((p) => p.status === "OPEN") || res.polls[0];
        setSelectedPoll(active);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPolls();
  }, []);

  function addOptionDraft() {
    setOptionsDraft((curr) => [
      ...curr,
      {
        title: "",
        category: "Professional Skills",
        description: "",
        difficulty: "Intermediate",
        durationWeeks: 6,
        learningOutcomes: "",
      },
    ]);
  }

  function updateOptionDraft(index: number, field: keyof NewOptionDraft, val: string | number) {
    setOptionsDraft((curr) =>
      curr.map((item, idx) => (idx === index ? { ...item, [field]: val } : item))
    );
  }

  function removeOptionDraft(index: number) {
    if (optionsDraft.length <= 2) {
      alert("A poll requires at least 2 course proposals for learners to compare.");
      return;
    }
    setOptionsDraft((curr) => curr.filter((_, idx) => idx !== index));
  }

  async function handleCreatePoll(e: React.FormEvent) {
    e.preventDefault();
    if (!pollTitle.trim()) return;

    for (const opt of optionsDraft) {
      if (!opt.title.trim()) {
        alert("Please provide a title for all proposed courses.");
        return;
      }
    }

    setCreating(true);
    try {
      const formattedOptions = optionsDraft.map((opt, i) => ({
        title: opt.title.trim(),
        category: opt.category.trim(),
        description: opt.description.trim(),
        difficulty: opt.difficulty,
        durationWeeks: Number(opt.durationWeeks) || 6,
        learningOutcomes: opt.learningOutcomes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        orderIndex: i,
      }));

      await apiPost("/polls/admin", {
        title: pollTitle.trim(),
        description: pollDescription.trim(),
        status: publishImmediately ? "OPEN" : "DRAFT",
        startDate: pollStartDate ? new Date(pollStartDate).toISOString() : undefined,
        endDate: pollEndDate ? new Date(pollEndDate).toISOString() : undefined,
        allowVoteChange,
        showLiveResults,
        options: formattedOptions,
      });

      setCreateModalOpen(false);
      setPollTitle("");
      setPollDescription("");
      setSuccessMessage(
        publishImmediately
          ? `Poll "${pollTitle.trim()}" created and posted live to users!`
          : `Poll "${pollTitle.trim()}" saved as Draft.`
      );
      setTimeout(() => setSuccessMessage(null), 6000);
      await loadPolls();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to create poll");
    } finally {
      setCreating(false);
    }
  }

  async function handlePublishPoll(pollId: string) {
    const targetPoll = polls.find((p) => p.id === pollId) || selectedPoll;
    const title = targetPoll?.title || "this poll";
    if (
      !confirm(
        `Post "${title}" live to users?\n\nThis will make the poll immediately open for community voting and notify active learners to cast their votes.`
      )
    ) {
      return;
    }

    setActionLoading(`publish-${pollId}`);
    try {
      const res = await apiPost<{ poll: CoursePollItem; notifiedCount?: number; message?: string }>(
        `/polls/admin/polls/${pollId}/publish`,
        {}
      );
      setSuccessMessage(res.message || `Successfully posted "${title}" live to users!`);
      setTimeout(() => setSuccessMessage(null), 8000);
      await loadPolls();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to post poll to users");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleStatusChange(pollId: string, status: "DRAFT" | "OPEN" | "CLOSED" | "ARCHIVED") {
    setActionLoading(`status-${pollId}`);
    try {
      await apiPut(`/polls/admin/${pollId}/status`, { status });
      await loadPolls();
    } catch {
      alert("Failed to update poll status");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleConvertToCourse(optionId: string, title: string) {
    if (
      !confirm(
        `Convert "${title}" into a live Course draft?\n\nThis will automatically populate the Course catalog entry with learning outcomes, duration, and category, and allow you to build its Roadmap and assign mentors.`
      )
    ) {
      return;
    }

    setActionLoading(`convert-${optionId}`);
    try {
      const res = await apiPost<{ course: { id: string; title: string } }>(
        `/polls/admin/options/${optionId}/convert-to-course`
      );
      setSuccessMessage(`Successfully created Course draft: "${res.course.title}"!`);
      setTimeout(() => setSuccessMessage(null), 6000);
      await loadPolls();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to convert proposal to course draft");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkWinner(optionId: string) {
    setActionLoading(`winner-${optionId}`);
    try {
      await apiPost(`/polls/admin/options/${optionId}/mark-winner`, {});
      await loadPolls();
    } catch {
      alert("Failed to mark winner");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading course demand analytics..." />
      </div>
    );
  }

  const activePoll = selectedPoll || polls[0];
  const totalVotes = activePoll ? activePoll.options.reduce((acc, o) => acc + o.votes, 0) : 0;

  // Sort options by votes descending for ranking
  const rankedOptions = activePoll
    ? [...activePoll.options].sort((a, b) => b.votes - a.votes)
    : [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink-900">
            Course Demand & Prioritization Polling
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Analyze learner demand, evaluate votes, select winning proposals, and convert them directly into structured Course drafts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-brand-700 transition"
        >
          <Add fontSize="small" />
          <span>Create New Course Poll</span>
        </button>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle fontSize="small" />
            <span>{successMessage}</span>
          </div>
          <Link href="/dashboard/admin/courses" className="underline hover:text-emerald-950">
            Go to Course Builder →
          </Link>
        </div>
      )}

      {polls.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <HowToVote className="mx-auto text-slate-400" sx={{ fontSize: 48 }} />
          <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">No Course Polls Created Yet</h3>
          <p className="mt-2 text-sm text-slate-600">
            Launch a curriculum poll to let learners vote on which programs you develop next.
          </p>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="mt-5 rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-brand-700"
          >
            Create Inaugural Poll
          </button>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Left Column: Poll Selector & Quick Controls */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Poll Cycles ({polls.length})
            </h2>
            <div className="space-y-2">
              {polls.map((p) => {
                const isSelected = p.id === activePoll?.id;
                const pVotes = p.options.reduce((acc, o) => acc + o.votes, 0);

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPoll(p)}
                    className={cn(
                      "w-full rounded-xl border p-4 text-left transition-all",
                      isSelected
                        ? "border-brand-600 bg-brand-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                          p.status === "OPEN"
                            ? "bg-emerald-100 text-emerald-800"
                            : p.status === "CLOSED"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-amber-100 text-amber-800"
                        )}
                      >
                        {p.status}
                      </span>
                      <span className="text-xs font-mono text-slate-500">
                        {pVotes} votes
                      </span>
                    </div>
                    <p className="mt-2 font-display text-sm font-semibold text-ink-900 line-clamp-1">
                      {p.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">
                      {p.options.length} proposed courses
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Poll Analytics & Proposals Ranking */}
          {activePoll && (
            <div className="lg:col-span-8 space-y-6">
              {/* Poll Summary Bar */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider",
                          activePoll.status === "OPEN"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        )}
                      >
                        {activePoll.status}
                      </span>
                      <span className="text-xs text-slate-400">
                        Created {new Date(activePoll.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h2 className="mt-2 font-display text-xl font-semibold text-ink-900">
                      {activePoll.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-600">{activePoll.description}</p>
                  </div>

                  {/* Lifecycle Controls */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {activePoll.status !== "OPEN" ? (
                      <button
                        type="button"
                        onClick={() => handlePublishPoll(activePoll.id)}
                        disabled={actionLoading === `publish-${activePoll.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#308d46] px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                      >
                        <Campaign fontSize="small" />
                        <span>{actionLoading === `publish-${activePoll.id}` ? "Posting..." : "Post Poll to Users"}</span>
                      </button>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                          <CheckCircle fontSize="inherit" />
                          <span>Live to Users</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePublishPoll(activePoll.id)}
                          disabled={actionLoading === `publish-${activePoll.id}`}
                          title="Broadcast a notification to learners about this active poll"
                          className="inline-flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                        >
                          <Campaign fontSize="small" />
                          <span>Announce / Re-post</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(activePoll.id, "CLOSED")}
                          disabled={actionLoading === `status-${activePoll.id}`}
                          className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
                        >
                          <Stop fontSize="small" />
                          <span>Close Voting</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-center">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Votes Cast</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-brand-700">
                      {totalVotes.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Proposed Courses</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-ink-900">
                      {activePoll.options.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Top Candidate</p>
                    <p className="mt-1 font-display text-sm font-semibold text-ink-900 truncate">
                      {rankedOptions[0]?.title || "—"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Proposals Demand Ranking */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-ink-900">
                    Proposed Courses & Demand Ranking
                  </h3>
                  <span className="text-xs text-slate-500">
                    Highest voted proposal displayed first
                  </span>
                </div>

                <div className="space-y-3">
                  {rankedOptions.map((opt, rankIdx) => {
                    const percentage = Math.round((opt.votes / (totalVotes || 1)) * 100);
                    const isLeader = rankIdx === 0 && opt.votes > 0;

                    return (
                      <div
                        key={opt.id}
                        className={cn(
                          "relative overflow-hidden rounded-xl border bg-white p-5 shadow-xs transition",
                          opt.isWinningOption
                            ? "border-amber-400 bg-amber-50/20"
                            : isLeader
                            ? "border-brand-500"
                            : "border-slate-200"
                        )}
                      >
                        {/* Progress fill */}
                        <div
                          className="absolute inset-y-0 left-0 bg-slate-100/70 -z-10 transition-all duration-500"
                          style={{ width: `${Math.max(percentage, 2)}%` }}
                        />

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-semibold text-slate-400">
                                #{rankIdx + 1}
                              </span>
                              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                                {opt.category}
                              </span>
                              {opt.isWinningOption && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                                  <EmojiEvents fontSize="inherit" />
                                  Selected Winner
                                </span>
                              )}
                              {isLeader && !opt.isWinningOption && (
                                <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-semibold text-brand-800">
                                  Leading Candidate
                                </span>
                              )}
                            </div>

                            <h4 className="font-display text-base font-semibold text-ink-900">
                              {opt.title}
                            </h4>
                            <p className="mt-1 text-xs text-slate-600 line-clamp-2">
                              {opt.description}
                            </p>

                            {opt.learningOutcomes && opt.learningOutcomes.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {opt.learningOutcomes.map((loc) => (
                                  <span
                                    key={loc}
                                    className="rounded bg-white border border-slate-200 px-2 py-0.5 text-[10px] text-slate-600"
                                  >
                                    ✓ {loc}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <div className="text-right">
                              <span className="font-mono text-lg font-semibold text-ink-900">
                                {opt.votes.toLocaleString()}
                              </span>
                              <span className="text-xs text-slate-500 ml-1">votes</span>
                              <div className="font-mono text-xs font-semibold text-brand-700">
                                {percentage}% of total
                              </div>
                            </div>

                            {/* Conversion to Course Draft */}
                            <div className="flex items-center gap-1.5">
                              {!opt.isWinningOption && (
                                <button
                                  type="button"
                                  onClick={() => handleMarkWinner(opt.id)}
                                  disabled={actionLoading === `winner-${opt.id}`}
                                  className="rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                  title="Mark as Winner"
                                >
                                  Mark Winner
                                </button>
                              )}

                              {opt.convertedCourseId ? (
                                <Link
                                  href={`/dashboard/admin/courses`}
                                  className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                                >
                                  <CheckCircle fontSize="inherit" />
                                  <span>Draft Created</span>
                                </Link>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleConvertToCourse(opt.id, opt.title)}
                                  disabled={actionLoading === `convert-${opt.id}`}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700 transition"
                                >
                                  <School fontSize="inherit" />
                                  <span>Convert to Course</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Course Poll */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative my-8 w-full max-w-3xl rounded-xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h2 className="font-display text-base font-semibold text-ink-900">
                Launch New Course Prioritization Poll
              </h2>
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
              >
                <Close fontSize="small" />
              </button>
            </div>

            <form onSubmit={handleCreatePoll} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Poll Title *</label>
                <input
                  type="text"
                  required
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  placeholder="e.g. Q1 Curriculum Prioritization Vote"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={pollDescription}
                  onChange={(e) => setPollDescription(e.target.value)}
                  placeholder="Explain why learners are voting and how winning courses are published..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={pollStartDate}
                    onChange={(e) => setPollStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End / Closing Date</label>
                  <input
                    type="date"
                    value={pollEndDate}
                    onChange={(e) => setPollEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowVoteChange}
                    onChange={(e) => setAllowVoteChange(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Allow learners to change vote before close</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLiveResults}
                    onChange={(e) => setShowLiveResults(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Show live results to participants</span>
                </label>

                <label className="flex items-start gap-2.5 text-xs font-semibold text-emerald-800 cursor-pointer bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={publishImmediately}
                    onChange={(e) => setPublishImmediately(e.target.checked)}
                    className="rounded text-[#308d46] focus:ring-emerald-500 h-4 w-4 mt-0.5"
                  />
                  <div>
                    <span>Post live to users immediately upon creation</span>
                    <p className="text-[11px] font-normal text-slate-600">
                      If checked, status is set to OPEN and the poll appears on the learner voting page right away. Uncheck to save as Draft.
                    </p>
                  </div>
                </label>
              </div>

              {/* Proposed Courses Drafts */}
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Proposed Courses for Voting ({optionsDraft.length})
                  </label>
                  <button
                    type="button"
                    onClick={addOptionDraft}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-brand-700 hover:bg-slate-100 transition"
                  >
                    + Add Proposed Course
                  </button>
                </div>

                {optionsDraft.map((opt, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-semibold text-slate-500">
                        Proposal #{idx + 1}
                      </span>
                      {optionsDraft.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOptionDraft(idx)}
                          className="text-xs text-rose-600 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <input
                          type="text"
                          required
                          value={opt.title}
                          onChange={(e) => updateOptionDraft(idx, "title", e.target.value)}
                          placeholder="Course Title (e.g. Distributed Systems in Go)"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={opt.category}
                          onChange={(e) => updateOptionDraft(idx, "category", e.target.value)}
                          placeholder="Category (e.g. Computer Science)"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                        />
                      </div>
                    </div>

                    <textarea
                      rows={2}
                      value={opt.description}
                      onChange={(e) => updateOptionDraft(idx, "description", e.target.value)}
                      placeholder="Concise overview of curriculum and practical outcomes..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                    />

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <select
                          value={opt.difficulty}
                          onChange={(e) => updateOptionDraft(idx, "difficulty", e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                      <div>
                        <input
                          type="number"
                          min={1}
                          value={opt.durationWeeks}
                          onChange={(e) => updateOptionDraft(idx, "durationWeeks", Number(e.target.value))}
                          placeholder="Duration in weeks"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={opt.learningOutcomes}
                          onChange={(e) => updateOptionDraft(idx, "learningOutcomes", e.target.value)}
                          placeholder="Outcomes (comma-separated)"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-xl bg-brand-600 px-5 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                >
                  {creating ? "Saving..." : publishImmediately ? "Post Poll to Users" : "Save as Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
