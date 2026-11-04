"use client";

import { useState } from "react";
import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";

interface PollOption {
  id: string;
  text: string;
  votes: number;
}

interface PollResult {
  question: string;
  options: PollOption[];
  totalVotes: number;
}

// Static polling data - using actual existing poll data structure
const CURRENT_POLL: PollResult = {
  question: "Which course should EduAltTech introduce next?",
  options: [
    { id: "1", text: "Artificial Intelligence Fundamentals", votes: 47 },
    { id: "2", text: "Classical Dance Techniques", votes: 33 },
    { id: "3", text: "Sustainable Agriculture", votes: 28 },
    { id: "4", text: "Pottery & Ceramic Arts", votes: 19 },
  ],
  totalVotes: 127,
};

export default function CommunitySection() {
  const [showResults, setShowResults] = useState(false);

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl leading-tight">
            Your Voice Shapes What Comes Next.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
            EduAltTech values what its learning community wants to explore. Have your say in shaping future learning opportunities.
          </p>
        </div>

        <div className="mt-16">
          <div className="bg-white rounded-lg p-8 md:p-10 border border-slate-200">
            <div className="mb-6">
              <p className="font-display font-medium text-ink-900">{CURRENT_POLL.question}</p>
              <p className="mt-2 text-sm text-slate-500">
                {CURRENT_POLL.totalVotes} people have voted
              </p>
            </div>

            {showResults ? (
              <div className="space-y-4">
                {CURRENT_POLL.options.map((option) => (
                  <div key={option.id} className="flex items-center justify-between">
                    <span className="font-medium text-ink-900">{option.text}</span>
                    <div className="w-48 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-brand-600 rounded-full transition-width"
                        style={{ width: `${option.votes / CURRENT_POLL.totalVotes * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-500">{option.votes} votes</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {CURRENT_POLL.options.map((option) => (
                  <div
                    key={option.id}
                    className="p-4 border rounded-lg border-slate-200 bg-white hover:border-brand-100 transition-colors cursor-pointer"
                    onClick={() => setShowResults(true)}
                  >
                    <p className="font-medium text-ink-900">{option.text}</p>
                    <p className="text-sm text-slate-500">{option.votes} votes</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-8">
            <Link
              href="/polls"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              View all polling campaigns
              <ArrowForward className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}