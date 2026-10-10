"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import { formatDate } from "@/lib/format";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";

type RosterLearner = {
  id: string;
  user: { id: string; firstName: string; lastName: string; avatarUrl: string | null; email: string };
  status: string;
  progressPct: number;
  enrolledAt: string;
  mentor: { id: string; firstName: string; lastName: string } | null;
};

function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase() || "?";
}

export default function LearnerRoster({ slug }: { slug: string }) {
  const [learners, setLearners] = useState<RosterLearner[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { learners } = await apiGet<{ learners: RosterLearner[] }>(`/courses/${slug}/learners`);
      setLearners(learners);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the learner roster.");
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!learners) return <Spinner label="Loading learners…" />;
  if (learners.length === 0) {
    return <EmptyState title="No learners yet" description="Enrolled learners will appear here with their progress." />;
  }

  return (
    <ul className="flex flex-col divide-y divide-slate-200 rounded-[20px] border border-slate-200 bg-white">
      {learners.map((l) => (
        <li key={l.id} className="flex flex-wrap items-center gap-4 p-4 sm:p-5">
          {l.user.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={l.user.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-sm font-bold text-brand-700">
              {initials(l.user.firstName, l.user.lastName)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink-900">
              {`${l.user.firstName} ${l.user.lastName}`.trim()}
            </p>
            <p className="truncate text-sm text-slate-500">
              {l.user.email} · enrolled {formatDate(l.enrolledAt)}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold text-ink-700">{l.progressPct}% complete</p>
            <p className="text-slate-500">
              {l.mentor ? `Mentor: ${l.mentor.firstName} ${l.mentor.lastName}`.trim() : "No assigned mentor"}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
