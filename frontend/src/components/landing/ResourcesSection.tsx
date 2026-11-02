"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { cn } from "@/lib/cn";

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: React.ReactNode;
}

// Static resource categories - no API call needed
const RESOURCE_CATEGORIES = [
  { id: "ai-ml", name: "AI & Machine Learning", icon: "Brain" },
  { id: "programming", name: "Programming", icon: "Code" },
  { id: "cybersecurity", name: "Cybersecurity", icon: "Shield" },
  { id: "entrepreneurship", name: "Entrepreneurship", icon: "TrendingUp" },
  { id: "music", name: "Music & Singing", icon: "Music" },
  { id: "dance", name: "Dancing", icon: "Dance" },
  { id: "agriculture", name: "Agriculture", icon: "Leaf" },
  { id: "pottery", name: "Pottery & Craft", icon: "Palette" },
];

const RESOURCES = {
  "AI & Machine Learning": [
    {
      id: "1",
      title: "Introduction to AI Prompting",
      description: "Master the art of effectively communicating with AI systems.",
    },
    {
      id: "2",
      title: "Machine Learning Fundamentals",
      description: "Core concepts and practical applications of ML models.",
    },
  ],
  Programming: [
    {
      id: "3",
      title: "JavaScript Basics",
      description: "From syntax to building interactive web applications.",
    },
    {
      id: "4",
      title: "Python for Beginners",
      description: "Learn Python for data analysis and automation.",
    },
  ],
  Cybersecurity: [
    {
      id: "5",
      title: "Online Safety Fundamentals",
      description: "Protect yourself and your data in the digital world.",
    },
    {
      id: "6",
      title: "Network Security Basics",
      description: "Understanding network threats and defense strategies.",
    },
  ],
  Entrepreneurship: [
    {
      id: "7",
      title: "Starting Your Venture",
      description: "From idea to launch: practical steps for new entrepreneurs.",
    },
    {
      id: "8",
      title: "Business Model Design",
      description: "Creating sustainable and scalable business models.",
    },
  ],
  Music: [
    {
      id: "9",
      title: "Finding Your Voice",
      description: "Basics of singing and vocal technique.",
    },
    {
      id: "10",
      title: "Music Theory Essentials",
      description: "Understanding the fundamentals of music structure.",
    },
  ],
  Dance: [
    {
      id: "11",
      title: "Movement Basics",
      description: "Introduction to various dance styles and movements.",
    },
    {
      id: "12",
      title: "Choreography Fundamentals",
      description: "Creating your own dance sequences and routines.",
    },
  ],
  Agriculture: [
    {
      id: "13",
      title: "Sustainable Farming",
      description: "Principles of environmentally responsible agriculture.",
    },
    {
      id: "14",
      title: "Urban Gardening",
      description: "Growing food in limited spaces.",
    },
  ],
  Pottery: [
    {
      id: "15",
      title: "Introduction to Clay",
      description: "Basic techniques for working with pottery clay.",
    },
    {
      id: "16",
      title: "Glazing and Firing",
      description: "Finishing techniques for pottery pieces.",
    },
  ],
};

export default function ResourcesSection() {
  return (
    <section className="border-b border-slate-200 bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl leading-tight">
            Curiosity Should Never Have a Boundary
          </h2>
          <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg max-w-2xl mx-auto">
            Educational articles, tutorials, guides, and topic-based resources. Technical and non-technical learning materials that are accessible and easy to explore.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {RESOURCE_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="group border rounded-lg border-slate-200 p-6 hover:border-brand-600 transition-colors hover:bg-slate-50"
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:bg-brand-600 transition-colors">
                <svg className="w-6 h-6 text-slate-400 group-hover:text-white" aria-hidden="true">
                  {/* Icon placeholder - would use Lucide in actual implementation */}
                </svg>
              </div>
              <h3 className="mt-4 font-display font-medium text-ink-900">{category.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Tutorials and guides for {category.name.toLowerCase()}
              </p>
              <Link
                href="/resources?type={category.id}"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Browse resources
                <svg className="arrow-down inline w-2 h-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}