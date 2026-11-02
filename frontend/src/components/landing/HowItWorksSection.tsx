"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/cn";

interface Step {
  id: number;
  title: string;
  description: string;
  image: string;
}

const LEARNER_JOURNEY: Step[] = [
  {
    id: 1,
    title: "Find Your Course",
    description: "Browse by category, read descriptions, and explore skills that interest you — from AI and programming to pottery and music.",
    image: "/media/courses/introduction-to-ai.jpg",
  },
  {
    id: 2,
    title: "Enrol",
    description: "Create a free account, enrol in your chosen course, and start learning immediately. Free open notes need no login.",
    image: "/media/courses/python-basics.jpg",
  },
  {
    id: 3,
    title: "Start Learning",
    description: "Follow structured lessons, submit projects, get mentor feedback, and book 1-on-1 check-ins with the practitioner who built the course.",
    image: "/media/courses/javascript-basics.jpg",
  },
];

export default function HowItWorksSection() {
  const [current, setCurrent] = useState(0);

  return (
    <section className="border-t border-slate-200 bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl leading-tight">
            How learning works on EduAltTech
          </h2>
          <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg">
            Three clear steps from choosing your topic to shipping your first project.
          </p>
        </div>

        <div className="mt-16 grid max-w-3xl mx-auto grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {LEARNER_JOURNEY.map((step) => (
            <div
              key={step.id}
              className="p-6 rounded-lg border border-slate-200 bg-white transition-all duration-300 hover:border-brand-600 hover:bg-slate-50"
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-brand-600 text-white mb-4">
                <span className="font-display font-semibold">{step.id}</span>
              </div>
              <h3 className="font-display font-medium text-ink-900 mb-2">{step.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{step.description}</p>
              <Image
                src={step.image}
                alt={step.title}
                className="mt-4 rounded-lg w-full h-40 object-cover"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}