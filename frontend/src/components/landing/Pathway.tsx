"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { cn } from "@/lib/cn";

interface Feature {
  id: string;
  title: string;
  content: string;
  image: string;
}

const FEATURES: Feature[] = [
  {
    id: "Find your course",
    title: "Find your course",
    content:
      "Browse by track, category, or skill. Every course shows its roadmap, chapters, mentor, and price before you commit.",
    image: "/media/photos/find course.jpg",
  },
  {
    id: "Enroll and start",
    title: "Enroll and start",
    content:
      "Create a free account, enroll, and work through chapters at your own pace. Free open notes need no login.",
    image: "/media/photos/enroll.jpg",
  },
  {
    id: "Learn with a mentor",
    title: "Learn with a mentor",
    content:
      "Submit projects, get feedback, and book 1-on-1 check-ins with the practitioner who built the course.",
    image: "/media/photos/start learning.jpg",
  },
];

const AUTOPLAY_MS = 4500;

export default function Pathway() {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrent((c) => (c + 1) % FEATURES.length);
          return 0;
        }
        return prev + 100 / (AUTOPLAY_MS / 100);
      });
    }, 100);
    return () => clearInterval(timer);
  }, []);

  const select = (i: number) => {
    setCurrent(i);
    setProgress(0);
  };

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl sm:leading-tight">
              How learning works on EduAltTech
            </h2>
            <p className="mt-3 text-base sm:text-lg leading-relaxed text-slate-600">
              Three clear steps from choosing your topic to shipping your first project.
            </p>
          </div>
          <Link
            href="/courses"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Get started
            <ArrowForward fontSize="small" />
          </Link>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2 md:gap-12">
          <ol className="order-2 space-y-6 md:order-1">
            {FEATURES.map((feature, index) => {
              const active = index === current;
              const done = index < current;
              return (
                <li key={feature.id}>
                  <button
                    type="button"
                    onClick={() => select(index)}
                    aria-current={active ? "step" : undefined}
                    className={cn(
                      "flex w-full items-start gap-5 rounded-lg p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40",
                      active ? "bg-slate-50" : "hover:bg-slate-50/60",
                    )}
                  >
                    <motion.span
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold",
                        active
                          ? "border-brand-600 bg-brand-600 text-white"
                          : done
                            ? "border-brand-600 bg-white text-brand-700"
                            : "border-slate-300 bg-white text-slate-400",
                      )}
                      
                    >
                      {done ? "✓" : index + 1}
                    </motion.span>

                    <div className="flex-1">
                      <h3 className="font-display text-lg font-semibold text-ink-900 sm:text-xl">
                        {feature.title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600 sm:text-base">
                        {feature.content}
                      </p>
                      {active && (
                        <span className="mt-3 block h-0.5 w-full overflow-hidden rounded-full bg-slate-200">
                          <motion.span
                            className="block h-full bg-brand-600"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="order-1 relative h-[240px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 md:order-2 md:h-[380px] lg:h-[420px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current}
                className="absolute inset-0"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -60, opacity: 0 }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={FEATURES[current].image}
                  alt={FEATURES[current].title}
                  className="h-full w-full object-cover"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-xl border border-slate-200 bg-white p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="max-w-2xl">
            <h3 className="font-display text-lg font-semibold text-ink-900">
              Already have the skill? Mentor a course and get paid.
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              Apply with your experience, get vetted by our academic team, then teach your own course
              and earn for every learner you guide.
            </p>
          </div>
          <Link
            href="/mentor"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-ink-700 transition hover:bg-slate-50"
          >
            Apply to mentor
            <ArrowForward fontSize="small" />
          </Link>
        </div>
      </div>
    </section>
  );
}
