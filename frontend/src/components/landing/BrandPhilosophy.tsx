"use client";

import Link from "next/link";

export default function BrandPhilosophy() {
  return (
    <section className="border-t border-slate-200 bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl leading-tight">
            Because Education Should Never Stop at the Classroom.
          </h2>

          <div className="mt-8 space-y-4">
            <p className="text-base leading-relaxed text-slate-600">
              Learn beyond boundaries. Explore new possibilities. Discover overlooked skills. Share knowledge. Create opportunities.
            </p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border rounded-lg border-slate-200 bg-slate-50">
                <h3 className="font-display font-medium text-ink-900">For Learners</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Discover skills you never thought you could learn, from AI to pottery.
                </p>
              </div>
              <div className="p-4 border rounded-lg border-slate-200 bg-slate-50">
                <h3 className="font-display font-medium text-ink-900">For Mentors</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Share your expertise, inspire learners, and build meaningful opportunities.
                </p>
              </div>
              <div className="p-4 border rounded-lg border-slate-200 bg-slate-50">
                <h3 className="font-display font-medium text-ink-900">For Education</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  Practical learning that extends beyond conventional academic boundaries.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-slate-200">
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Start Exploring
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M7 10l5 5 5-5" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}