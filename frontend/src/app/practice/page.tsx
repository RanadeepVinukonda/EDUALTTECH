"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface Problem {
  id: string;
  slug: string;
  title: string;
  topic: string;
  difficulty: number;
  language: string;
}

const DIFFICULTY = ["", "Easy", "Medium", "Hard"];
const DIFFICULTY_COLOR = ["", "text-brand-700 bg-brand-50", "text-amber-700 bg-amber-50", "text-red-600 bg-red-50"];

export default function PracticePage() {
  const [items, setItems] = useState<Problem[]>([]);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<{ items: Problem[] }>(`/practice?topic=${encodeURIComponent(topic)}`)
      .then((d) => setItems(d.items))
      .finally(() => setLoading(false));
  }, [topic]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-slate-900">Practice zone</h1>
      <p className="mt-1 text-slate-600">Coding & subject problems with attempt history and daily activity tracking.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {["", "Basics", "Strings", "Loops", "Arrays"].map((t) => (
          <button
            key={t || "all"}
            onClick={() => setTopic(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              topic === t ? "bg-brand-600 text-white" : "border border-slate-300 text-slate-600 hover:border-brand-400"
            }`}
          >
            {t || "All topics"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-10 text-slate-500">Loading problems…</p>
      ) : (
        <ul className="mt-8 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {items.map((p) => (
            <li key={p.id}>
              <Link
                href={`/practice/${p.slug}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50"
              >
                <div>
                  <p className="font-medium text-slate-900">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.topic} · {p.language}</p>
                </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${DIFFICULTY_COLOR[p.difficulty]}`}>
                {DIFFICULTY[p.difficulty]}
              </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
