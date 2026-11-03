"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
    content: "Review course details before enrolling.",
    image: "/media/photos/find course.jpg",
  },
  {
    id: "Start learning",
    title: "Start learning",
    content: "Create an account to enroll; free open notes require no login.",
    image: "/media/photos/enroll.jpg",
  },
  {
    id: "Learn with mentors",
    title: "Learn with mentors",
    content: "Submit projects, get feedback, and meet with your course mentor.",
    image: "/media/photos/start learning.jpg",
  },
];

export default function Pathway() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timer = window.setInterval(() => {
      setCurrent((step) => (step + 1) % FEATURES.length);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-section font-semibold tracking-tight text-ink-900 leading-tight">
            How learning works
          </h2>
          <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
            From interest to practice.
          </p>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-stretch md:gap-12">
          <ol className="relative flex flex-col justify-center">
            {FEATURES.map((feature, index) => {
              const active = index === current;
              return (
                <li key={feature.id} className="relative">
                  {index < FEATURES.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-[19px] top-10 w-px bg-slate-200"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setCurrent(index)}
                    aria-current={active ? "step" : undefined}
                    className="group relative flex min-h-24 w-full items-start gap-4 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
                  >
                    <span
                      className={cn(
                        "z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                        active
                          ? "border-brand-700 bg-brand-700 text-white"
                          : "border-slate-300 bg-slate-50 text-slate-600 group-hover:border-brand-300",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 pt-1">
                      <span
                        className={cn(
                          "block font-display text-lg font-semibold",
                          active ? "text-ink-900" : "text-slate-600 group-hover:text-ink-900",
                        )}
                      >
                        {feature.title}
                      </span>
                      {active && (
                        <span
                          aria-live="polite"
                          className="mt-2 block max-w-sm text-sm leading-relaxed text-slate-600"
                        >
                          {feature.content}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="relative min-h-[280px] min-w-0 overflow-hidden rounded-2xl bg-slate-200 md:min-h-[390px]">
            <Image
              key={current}
              src={FEATURES[current].image}
              alt={FEATURES[current].title}
              fill
              sizes="(min-width: 768px) 65vw, 100vw"
              className="object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 bg-ink-900/80 p-5 text-white sm:p-7">
              <div>
                <p className="text-sm font-medium text-white/75">
                  Step {current + 1} of {FEATURES.length}
                </p>
                <h3 className="mt-1 font-display text-xl font-semibold sm:text-2xl">
                  {FEATURES[current].title}
                </h3>
              </div>
              <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
                {FEATURES.map((feature, index) => (
                  <span
                    key={feature.id}
                    className={cn(
                      "h-1.5 rounded-full transition-colors",
                      index === current ? "w-7 bg-white" : "w-1.5 bg-white/50",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
