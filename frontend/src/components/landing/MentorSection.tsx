"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { cn } from "@/lib/cn";

interface MentorApplication {
  id: string;
  name: string;
  expertise: string;
  experience: string;
  status: "applied" | "under-review" | "approved" | "rejected";
}

const MENTOR_APPLICATIONS: MentorApplication[] = [
  {
    id: "1",
    name: "Dr. Aarav Mehta",
    expertise: "Artificial Intelligence",
    experience: "5 years research experience at leading tech companies",
    status: "approved",
  },
  {
    id: "2",
    name: "Priya Sharma",
    expertise: "Classical Dance",
    experience: "10 years performing and teaching internationally",
    status: "under-review",
  },
  {
    id: "3",
    name: "Marcus Williams",
    expertise: "Pottery & Craftsmanship",
    experience: "8 years practicing and conducting workshops",
    status: "approved",
  },
];

export default function MentorSection() {
  return (
    <section className="border-t border-slate-200 bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl leading-tight">
            Great Skills Deserve to Be Shared.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg max-w-2xl mx-auto">
            Behind every valuable skill is someone who took the time to master it. EduAltTech gives skilled individuals an opportunity to share their expertise, inspire learners, and build meaningful opportunities through teaching.
          </p>
        </div>

        <div className="mt-16 grid max-w-4xl mx-auto grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {MENTOR_APPLICATIONS.map((mentor) => (
            <div
              key={mentor.id}
              className="p-6 border rounded-lg border-slate-200 bg-white transition-colors hover:border-brand-600 hover:bg-slate-50"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#f0fff5" }}>
                  <span className="font-display font-bold text-brand-600">
                    {mentor.name.split(" ")[0][0]}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-display font-medium text-ink-900">{mentor.name}</h3>
                  <p className="mt-1 text-sm text-slate-500">{mentor.expertise}</p>
                  <p className="mt-1 text-xs text-slate-400">{mentor.experience}</p>
                </div>
              </div>
              {mentor.status === "approved" && (
                <p className="mt-3 text-xs font-medium text-brand-600">
                  ✓ Approved mentor
                </p>
              )}
              {mentor.status === "under-review" && (
                <p className="mt-3 text-xs font-medium text-brand-700">
                  ⏱️ Under review
                </p>
              )}
              <Link
                href="/mentor"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Apply to become a mentor
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}