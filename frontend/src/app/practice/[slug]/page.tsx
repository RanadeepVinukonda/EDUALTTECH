"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

interface Problem {
  id: string;
  slug: string;
  title: string;
  description: string;
  topic: string;
  difficulty: number;
  language: string;
  starterCode: string | null;
}

interface Attempt {
  id: string;
  result: string;
  detail?: string;
  runtimeMs?: number;
  createdAt?: string;
}

const DIFFICULTY = ["", "Easy", "Medium", "Hard"];
const DIFFICULTY_COLOR = ["", "bg-brand-50 text-brand-700", "bg-amber-50 text-amber-700", "bg-red-50 text-red-600"];

const VERDICTS: Record<string, { label: string; tone: string; hint: string }> = {
  ACCEPTED: {
    label: "Accepted",
    tone: "bg-brand-50 text-brand-700 border-brand-200",
    hint: "Your solution passed all tests.",
  },
  WRONG_ANSWER: {
    label: "Wrong answer",
    tone: "bg-red-50 text-red-600 border-red-200",
    hint: "One or more test cases failed.",
  },
  TIME_LIMIT: {
    label: "Time limit exceeded",
    tone: "bg-amber-50 text-amber-700 border-amber-200",
    hint: "The solution took longer than the 1500 ms judge allows.",
  },
  RUNTIME_ERROR: {
    label: "Runtime error",
    tone: "bg-red-50 text-red-600 border-red-200",
    hint: "The code threw while running. Check the detail below.",
  },
  COMPILE_ERROR: {
    label: "Compile error",
    tone: "bg-red-50 text-red-600 border-red-200",
    hint: "The code could not be compiled. Check the detail below.",
  },
};

export default function PracticeProblemPage() {
  const { slug } = useParams<{ slug: string }>();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [verdict, setVerdict] = useState<Attempt | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ problem: Problem }>(`/practice/${encodeURIComponent(slug)}`)
      .then((d) => {
        if (cancelled) return;
        setProblem(d.problem);
        setCode(d.problem.starterCode ?? "");
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load problem");
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (!problem) return;
    api<{ attempts: Attempt[] }>(`/practice/${problem.id}/attempts/me`)
      .then((d) => setAttempts(d.attempts))
      .catch(() => undefined);
  }, [problem]);

  async function submit() {
    if (!problem || busy || code.trim().length === 0) return;
    setBusy(true);
    setVerdict(null);
    setError(null);
    try {
      const d = await api<{ attempt: Attempt }>(`/practice/${problem.id}/attempts`, {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      setVerdict(d.attempt);
      setAttempts((a) => [d.attempt, ...a].slice(0, 20));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit solution");
    } finally {
      setBusy(false);
    }
  }

  if (error && !problem) return <div className="mx-auto max-w-5xl px-4 py-16 text-red-600">{error}</div>;
  if (!problem) return <div className="mx-auto max-w-5xl px-4 py-16 text-slate-500">Loading problem…</div>;

  const verdictInfo = verdict ? VERDICTS[verdict.result] : null;
  const jsOnly = problem.language !== "JAVASCRIPT";

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <Link href="/practice" className="text-sm font-semibold text-brand-700 hover:text-brand-800">
        ← All problems
      </Link>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-display text-3xl font-bold text-slate-900">{problem.title}</h1>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${DIFFICULTY_COLOR[problem.difficulty]}`}>
          {DIFFICULTY[problem.difficulty]}
        </span>
        <span className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
          {problem.topic} · {problem.language}
        </span>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Problem statement */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-display text-lg font-semibold text-slate-900">Problem</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">{problem.description}</p>

          {jsOnly ? (
            <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              Judging is available for JavaScript problems only right now. This problem is marked{" "}
              <span className="font-semibold">{problem.language}</span>.
            </p>
          ) : null}
        </section>

        {/* Editor */}
        <section className="flex flex-col rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <p className="font-display text-sm font-semibold text-slate-900">Solution</p>
            {!jsOnly && (
              <button
                onClick={submit}
                disabled={busy || code.trim().length === 0}
                className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {busy ? "Judging…" : "Run & submit"}
              </button>
            )}
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            disabled={jsOnly}
            placeholder={jsOnly ? "Judge only runs JavaScript problems." : "Write your solution…"}
            className="min-h-[320px] flex-1 resize-y bg-slate-950 p-5 font-mono text-sm leading-relaxed text-slate-100 focus:outline-none"
          />
          {!jsOnly && (
            <p className="border-t border-slate-100 px-5 py-2 text-xs text-slate-500">
              Verdicts are computed server-side. Judge timeout: 1500 ms.
            </p>
          )}
        </section>
      </div>

      {error && <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      {/* Verdict */}
      {verdictInfo && verdict && (
        <div className={`mt-6 rounded-2xl border p-5 ${verdictInfo.tone}`}>
          <div className="flex flex-wrap items-center gap-3">
            <p className="font-display text-lg font-semibold">{verdictInfo.label}</p>
            {verdict.runtimeMs != null && <span className="text-sm opacity-70">{verdict.runtimeMs} ms</span>}
          </div>
          <p className="mt-1 text-sm opacity-80">{verdictInfo.hint}</p>
          {verdict.detail && (
            <pre className="mt-3 overflow-x-auto rounded-lg bg-white/60 p-3 font-mono text-xs">{verdict.detail}</pre>
          )}
        </div>
      )}

      {/* My attempts */}
      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-slate-900">My attempts</h2>
        {attempts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No attempts yet on this problem.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {attempts.map((a) => {
              const row = VERDICTS[a.result];
              return (
                <li key={a.id} className="flex items-center justify-between px-5 py-3">
                  <span className={a.result === "ACCEPTED" ? "font-medium text-brand-700" : "text-slate-700"}>
                    {a.result === "ACCEPTED" ? "Solved" : row?.label ?? a.result}
                  </span>
                  <span className="text-xs text-slate-500">
                    {a.runtimeMs != null ? `${a.runtimeMs} ms · ` : ""}
                    {a.createdAt ? new Date(a.createdAt).toLocaleString() : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}