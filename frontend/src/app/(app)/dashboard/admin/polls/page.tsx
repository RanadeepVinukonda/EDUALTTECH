"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import HowToVote from "@mui/icons-material/HowToVote";
import Add from "@mui/icons-material/Add";
import CheckCircle from "@mui/icons-material/CheckCircle";
import Close from "@mui/icons-material/Close";
import Delete from "@mui/icons-material/Delete";
import EmojiEvents from "@mui/icons-material/EmojiEvents";
import School from "@mui/icons-material/School";
import Stop from "@mui/icons-material/Stop";
import Campaign from "@mui/icons-material/Campaign";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api";
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

function statusLabel(status: string) {
  const label = status.replace(/_/g, " ").toLowerCase();
  return label.charAt(0).toUpperCase() + label.slice(1);
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
      } else {
        setSelectedPoll(null);
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
        category: opt.category.trim() || "General",
        domain: opt.category.trim() || "General",
        description: opt.description.trim(),
        difficulty: opt.difficulty,
        estimatedDuration: `${Number(opt.durationWeeks)} weeks`,
        outcomes: opt.learningOutcomes
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 10),
        orderIndex: i,
      }));

      await apiPost("/polls/admin", {
        title: pollTitle.trim(),
        description: pollDescription.trim(),
        status: publishImmediately ? "OPEN" : "DRAFT",
        startDate: pollStartDate ? new Date(pollStartDate).toISOString() : undefined,
        endDate: pollEndDate ? new Date(`${pollEndDate}T23:59:59.999Z`).toISOString() : undefined,
        allowVoteChange,
        hideResultsUntilClosed: !showLiveResults,
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

  async function handleDeletePoll(pollId: string) {
    const poll = polls.find((item) => item.id === pollId);
    if (!poll) return;
    if (
      !confirm(
        `Delete "${poll.title}" permanently?\n\nThis also deletes its proposals and votes. This action cannot be undone.`
      )
    ) {
      return;
    }

    setActionLoading(`delete-${pollId}`);
    try {
      await apiDelete(`/polls/admin/polls/${pollId}`);
      setPolls((current) => current.filter((item) => item.id !== pollId));
      setSelectedPoll((current) => (current?.id === pollId ? null : current));
      setSuccessMessage(`Poll "${poll.title}" was deleted.`);
      setTimeout(() => setSuccessMessage(null), 6000);
      await loadPolls();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete poll");
    } finally {
      setActionLoading(null);
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
    <div className="min-w-0 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ink-900 sm:text-[28px]">
            Course demand and prioritization polls
          </h1>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600">
            Analyze learner demand, evaluate votes, select winning proposals, and convert them directly into structured course drafts.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          <Add fontSize="small" />
          <span>Create new course poll</span>
        </button>
      </div>

      {successMessage && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm font-semibold text-brand-900">
          <div className="flex items-center gap-2">
            <CheckCircle fontSize="small" />
            <span>{successMessage}</span>
          </div>
          <Link href="/dashboard/admin/courses" className="underline hover:text-brand-950">
            Go to course builder
          </Link>
        </div>
      )}

      {polls.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-paper-2 p-8 text-center sm:p-12">
          <HowToVote className="mx-auto text-slate-400" sx={{ fontSize: 48 }} />
          <h3 className="mt-4 font-display text-lg font-semibold text-ink-900">No course polls created yet</h3>
          <p className="mt-2 text-sm text-slate-600">
            Launch a curriculum poll to let learners vote on which programs you develop next.
          </p>
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="mt-5 min-h-11 rounded-lg bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
          >
            Create first poll
          </button>
        </div>
      ) : (
        <div className="grid min-w-0 gap-6 lg:grid-cols-12">
          {/* Left Column: Poll Selector & Quick Controls */}
          <div className="lg:col-span-4 space-y-4">
            <h2 className="text-sm font-semibold text-ink-800">
              Polls ({polls.length})
            </h2>
            <div className="space-y-2">
              {polls.map((p) => {
                const isSelected = p.id === activePoll?.id;
                const pVotes = p.options.reduce((acc, o) => acc + o.votes, 0);
                const deleting = actionLoading === `delete-${p.id}`;

                return (
                  <div
                    key={p.id}
                    className={cn(
                      "flex items-stretch gap-2 rounded-lg border p-2 transition-colors",
                      isSelected
                        ? "border-brand-600 bg-brand-50/40 shadow-xs"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedPoll(p)}
                      aria-pressed={isSelected}
                      className="min-w-0 flex-1 p-2 text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            p.status === "OPEN"
                              ? "bg-brand-50 text-brand-800"
                              : p.status === "CLOSED"
                                ? "bg-slate-100 text-ink-700"
                                : "bg-paper-2 text-ink-700"
                          )}
                        >
                          {statusLabel(p.status)}
                        </span>
                        <span className="text-xs text-slate-500">{pVotes} votes</span>
                      </div>
                      <p className="mt-2 line-clamp-1 font-display text-sm font-semibold text-ink-900">
                        {p.title}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                        {p.options.length} proposed courses
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeletePoll(p.id)}
                      disabled={deleting || actionLoading !== null}
                      aria-label={`Delete poll ${p.title}`}
                      title="Delete poll and its votes"
                      className="inline-flex min-h-11 w-11 shrink-0 items-center justify-center self-center rounded-lg text-danger transition-colors hover:bg-danger/5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Delete fontSize="small" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Poll Analytics & Proposals Ranking */}
          {activePoll && (
            <div className="lg:col-span-8 space-y-6">
              {/* Poll Summary Bar */}
              <div className="min-w-0 rounded-lg border border-slate-200 bg-paper p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          activePoll.status === "OPEN"
                            ? "bg-brand-50 text-brand-800"
                            : "bg-slate-100 text-ink-700"
                        )}
                      >
                        {statusLabel(activePoll.status)}
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
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-brand-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
                      >
                        <Campaign fontSize="small" />
                        <span>{actionLoading === `publish-${activePoll.id}` ? "Posting..." : "Post poll to users"}</span>
                      </button>
                    ) : (
                      <>
                        <span className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800">
                          <CheckCircle fontSize="inherit" />
                          <span>Live to users</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handlePublishPoll(activePoll.id)}
                          disabled={actionLoading === `publish-${activePoll.id}`}
                          title="Broadcast a notification to learners about this active poll"
                          className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-100"
                        >
                          <Campaign fontSize="small" />
                          <span>Announce or repost</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(activePoll.id, "CLOSED")}
                          disabled={actionLoading === `status-${activePoll.id}`}
                          className="inline-flex min-h-11 items-center gap-1 rounded-lg border border-slate-300 bg-paper px-3 py-1.5 text-xs font-semibold text-ink-700 transition-colors hover:bg-paper-2"
                        >
                          <Stop fontSize="small" />
                          <span>Close voting</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Metrics */}
                <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4 text-center">
                  <div>
                    <p className="text-xs font-semibold text-slate-600">Total votes cast</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-brand-700">
                      {totalVotes.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600">Proposed courses</p>
                    <p className="mt-1 font-display text-2xl font-semibold text-ink-900">
                      {activePoll.options.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-600">Top candidate</p>
                    <p className="mt-1 font-display text-sm font-semibold text-ink-900 truncate">
                      {rankedOptions[0]?.title || "No proposals yet"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Proposals Demand Ranking */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-base font-semibold text-ink-900">
                    Proposed courses and demand ranking
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
                          "relative overflow-hidden rounded-lg border bg-paper p-5 shadow-xs transition-colors",
                          opt.isWinningOption
                            ? "border-brand-300 bg-brand-50/30"
                            : isLeader
                            ? "border-brand-500"
                            : "border-slate-200"
                        )}
                      >
                        {/* Progress fill */}
                        <div
                          className="absolute inset-y-0 left-0 -z-10 w-full origin-left scale-x-0 bg-paper-2 transition-transform duration-500 motion-reduce:transition-none"
                          style={{ transform: `scaleX(${Math.max(percentage, 2) / 100})` }}
                        />

                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="font-mono text-xs font-semibold text-slate-400">
                                #{rankIdx + 1}
                              </span>
                              <span className="rounded bg-paper-2 px-2 py-0.5 text-[11px] font-semibold text-ink-700">
                                {opt.category}
                              </span>
                              {opt.isWinningOption && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-800">
                                  <EmojiEvents fontSize="inherit" />
                                  Selected winner
                                </span>
                              )}
                              {isLeader && !opt.isWinningOption && (
                                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-800">
                                  Leading candidate
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
                                    className="rounded border border-slate-200 bg-paper px-2 py-0.5 text-[10px] text-ink-700"
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
                              <div className="text-xs font-semibold text-brand-700 tabular-nums">
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
                                  title="Mark as winner"
                                >
                                  Mark winner
                                </button>
                              )}

                              {opt.convertedCourseId ? (
                                <Link
                                  href={`/dashboard/admin/courses`}
                                  className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-800 transition-colors hover:bg-brand-100"
                                >
                                  <CheckCircle fontSize="inherit" />
                                  <span>Draft created</span>
                                </Link>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleConvertToCourse(opt.id, opt.title)}
                                  disabled={actionLoading === `convert-${opt.id}`}
                                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
                                >
                                  <School fontSize="inherit" />
                                  <span>Convert to course</span>
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
          <div className="relative my-8 w-full max-w-3xl rounded-xl bg-white border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 bg-slate-50">
              <h2 className="font-display text-base font-semibold text-ink-900">
                Launch a course prioritization poll
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
                <label htmlFor="poll-title" className="block text-xs font-semibold text-slate-700 mb-1">Poll title *</label>
                <p className="mb-1 text-[11px] text-slate-500">A short name learners will see for this vote. Use 3–160 characters.</p>
                <input
                  id="poll-title"
                  type="text"
                  required
                  minLength={3}
                  maxLength={160}
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  placeholder="e.g. Q1 curriculum prioritization vote"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="poll-description" className="block text-xs font-semibold text-slate-700 mb-1">Description *</label>
                <p className="mb-1 text-[11px] text-slate-500">Explain the purpose of the poll and how learners should choose. At least 5 characters.</p>
                <textarea
                  id="poll-description"
                  rows={2}
                  required
                  minLength={5}
                  maxLength={2000}
                  value={pollDescription}
                  onChange={(e) => setPollDescription(e.target.value)}
                  placeholder="Explain why learners are voting and how winning courses are published..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-brand-600 focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="poll-start-date" className="block text-xs font-semibold text-slate-700 mb-1">Start date (optional)</label>
                  <p className="mb-1 text-[11px] text-slate-500">Reference date for this poll. Polls are not scheduled automatically; posting live opens voting immediately.</p>
                  <input
                    id="poll-start-date"
                    type="date"
                    value={pollStartDate}
                    onChange={(e) => setPollStartDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
                <div>
                  <label htmlFor="poll-end-date" className="block text-xs font-semibold text-slate-700 mb-1">End date (optional)</label>
                  <p className="mb-1 text-[11px] text-slate-500">Voting remains open through this date, then votes are rejected. Leave blank for no deadline.</p>
                  <input
                    id="poll-end-date"
                    type="date"
                    value={pollEndDate}
                    onChange={(e) => setPollEndDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={allowVoteChange}
                    onChange={(e) => setAllowVoteChange(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    Allow learners to change vote
                    <span className="mt-0.5 block font-normal text-slate-500">When off, each learner is locked to their first vote.</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-2 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={showLiveResults}
                    onChange={(e) => setShowLiveResults(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    Show live results
                    <span className="mt-0.5 block font-normal text-slate-500">When off, learners cannot see vote counts until the poll is closed. Admins can still see results.</span>
                  </span>
                </label>

                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-brand-200 bg-brand-50 p-3 text-xs font-semibold text-brand-900 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={publishImmediately}
                    onChange={(e) => setPublishImmediately(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-brand-700 focus:ring-brand-600"
                  />
                  <div>
                    <span>Post live to users immediately upon creation</span>
                    <p className="text-[11px] font-normal text-slate-600">
                      When selected, the poll opens on the learner voting page after creation. Otherwise, it is saved as a draft.
                    </p>
                  </div>
                </label>
              </div>

              {/* Proposed Courses Drafts */}
              <div className="space-y-4 border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Proposed courses ({optionsDraft.length}) *
                  </label>
                  <p className="ml-3 text-[11px] text-slate-500">Add at least 2 options for learners to compare; each option becomes a proposal in the poll.</p>
                  <button
                    type="button"
                    onClick={addOptionDraft}
                    className="min-h-11 rounded-lg border border-slate-200 bg-paper-2 px-3 py-1 text-xs font-semibold text-brand-800 transition-colors hover:bg-slate-100"
                  >
                    + Add proposed course
                  </button>
                </div>

                {optionsDraft.map((opt, idx) => (
                  <div key={idx} className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-500">
                        Proposal #{idx + 1}
                      </span>
                      {optionsDraft.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOptionDraft(idx)}
                          className="text-xs text-danger hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label htmlFor={`proposal-title-${idx}`} className="mb-1 block text-[11px] font-semibold text-slate-700">Course title *</label>
                        <input
                          id={`proposal-title-${idx}`}
                          type="text"
                          required
                          minLength={2}
                          maxLength={160}
                          value={opt.title}
                          onChange={(e) => updateOptionDraft(idx, "title", e.target.value)}
                          placeholder="Course title (e.g. Distributed Systems in Go)"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                        />
                      </div>
                      <div>
                        <label htmlFor={`proposal-category-${idx}`} className="mb-1 block text-[11px] font-semibold text-slate-700">Category</label>
                        <input
                          id={`proposal-category-${idx}`}
                          type="text"
                          value={opt.category}
                          onChange={(e) => updateOptionDraft(idx, "category", e.target.value)}
                          placeholder="Category (e.g. Computer Science)"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                        />
                        <p className="mt-1 text-[10px] text-slate-500">Groups similar proposals; blank uses General.</p>
                      </div>
                    </div>

                    <label htmlFor={`proposal-description-${idx}`} className="block text-[11px] font-semibold text-slate-700">Course description *</label>
                    <p className="text-[11px] text-slate-500">Summarize what the proposed course covers. At least 5 characters.</p>
                    <textarea
                      id={`proposal-description-${idx}`}
                      rows={2}
                      required
                      minLength={5}
                      maxLength={1000}
                      value={opt.description}
                      onChange={(e) => updateOptionDraft(idx, "description", e.target.value)}
                      placeholder="Concise overview of curriculum and practical outcomes..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                    />

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div>
                        <label htmlFor={`proposal-difficulty-${idx}`} className="mb-1 block text-[11px] font-semibold text-slate-700">Difficulty</label>
                        <select
                          id={`proposal-difficulty-${idx}`}
                          value={opt.difficulty}
                          onChange={(e) => updateOptionDraft(idx, "difficulty", e.target.value)}
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                        <p className="mt-1 text-[10px] text-slate-500">The expected learner starting level.</p>
                      </div>
                      <div>
                        <label htmlFor={`proposal-duration-${idx}`} className="mb-1 block text-[11px] font-semibold text-slate-700">Duration (weeks)</label>
                        <input
                          id={`proposal-duration-${idx}`}
                          type="number"
                          min={1}
                          step={1}
                          required
                          value={opt.durationWeeks}
                          onChange={(e) => updateOptionDraft(idx, "durationWeeks", Number(e.target.value))}
                          placeholder="Duration in weeks"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                        />
                        <p className="mt-1 text-[10px] text-slate-500">Estimated time to complete the course.</p>
                      </div>
                      <div>
                        <label htmlFor={`proposal-outcomes-${idx}`} className="mb-1 block text-[11px] font-semibold text-slate-700">Learning outcomes</label>
                        <input
                          id={`proposal-outcomes-${idx}`}
                          type="text"
                          value={opt.learningOutcomes}
                          onChange={(e) => updateOptionDraft(idx, "learningOutcomes", e.target.value)}
                          placeholder="Outcomes (comma-separated)"
                          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                        />
                        <p className="mt-1 text-[10px] text-slate-500">Comma-separated; up to 10 skills or takeaways.</p>
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
                  {creating ? "Saving..." : publishImmediately ? "Post poll to users" : "Save as draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
