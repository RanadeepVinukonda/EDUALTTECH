"use client";

import Link from "next/link";
import { MentorApplications } from "@/components/admin/MentorApplications";

export default function AdminApplicationsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-ink-700">Mentor applications</h1>
      <p className="mt-1 text-sm text-slate-600">
        Applications live inside the course they target. Open a course folder to review, schedule an interview, approve
        or reject.
      </p>

      <div className="mt-6">
        <MentorApplications />
      </div>

      <p className="mt-8 text-sm text-slate-500">
        Prefer the course folders?{" "}
        <Link href="/admin/courses" className="font-medium text-brand-700 hover:text-brand-800">
          Browse all courses
        </Link>
      </p>
    </div>
  );
}
