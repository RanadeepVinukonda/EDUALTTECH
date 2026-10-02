"use client";

import Link from "next/link";
import { Compass } from "lucide-react";

export default function EmptyDashboard() {
  return (
    <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
        <Compass className="h-6 w-6" />
      </span>
      <h2 className="font-display mt-4 text-lg font-semibold text-slate-900">Your dashboard starts here</h2>
      <p className="mx-auto mt-1.5 max-w-md text-sm text-slate-600">
        Enroll in a course and this page fills up with your progress, activity and what to learn next.
      </p>
      <Link
        href="/courses"
        className="mt-5 inline-block rounded-xl brand-grad px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Explore courses
      </Link>
    </section>
  );
}
