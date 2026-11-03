"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";

export default function FinalCTA() {
  return (
    <section className="bg-ink-900 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl leading-tight">
            Your Next Skill Could Change Everything.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-slate-300 sm:text-lg max-w-2xl mx-auto">
            Start exploring new possibilities. Find something worth learning, meet people worth learning from, and take the next step toward becoming more capable.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mx-auto">
          <div>
            <Link
              href="/courses"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 font-display font-semibold text-ink-900 hover:bg-slate-100 transition-colors"
            >
              Start Learning
              <svg className="w-4 h-4 inline" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7 10l5 5 5-5" />
              </svg>
            </Link>
          </div>
          <div>
            <Link
              href="/mentor"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-white/25 px-8 py-4 font-display font-semibold text-white hover:bg-white/10 transition-colors"
            >
              Become a Mentor
              <svg className="w-4 h-4 inline" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7 10l5 5 5-5" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}