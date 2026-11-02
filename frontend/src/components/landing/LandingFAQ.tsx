"use client";

import { useState } from "react";
import ExpandMore from "@mui/icons-material/ExpandMore";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "What kind of alternate skills can I learn on EduAltTech?",
    answer:
      "We believe learning shouldn't be boxed into standard school syllabi or coding alone. Alongside applied AI, software engineering, and systems, we offer structured courses and roadmaps in music production, audio mixing, classical and modern dance, creative arts, and entrepreneurship. Any skill that empowers you to create and build has a home here.",
  },
  {
    question: "How does the 24/7 mentorship work in practice?",
    answer:
      "Every paid course connects you directly with working practitioners. You can submit questions, code reviews, audio mixes, or video practice at any time. Our mentors provide round-the-clock async doubt resolution, weekly scheduled 1-on-1 office hours, and actionable feedback so you never remain blocked.",
  },
  {
    question: "Are the open notes and roadmaps really 100% free?",
    answer:
      "Yes. Our open knowledge base provides high-yield concept breakdowns, formulas, syntax cheat sheets, music theory tables, and dance notations completely free with zero paywalls. You can study, reference, and revise anytime without even creating an account.",
  },
  {
    question: "Can I earn money by mentoring a course?",
    answer:
      "Absolutely. EduAltTech is a two-sided educational platform. If you have verifiable mastery in any skill — tech, music, dance, or design — you can apply through our mentor portal. Accepted mentors are employed to lead cohorts, provide feedback, and earn dependable compensation for their expertise.",
  },
  {
    question: "How does the community course voting and wishlist work?",
    answer:
      "Our roadmap is driven directly by learner demand. You can vote on monthly course candidates or submit any skill you wish to see on the platform. The top-voted topics are prioritized, assigned to vetted expert practitioners, and published to the live catalog.",
  },
];

export default function LandingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <section className="bg-white py-16 sm:py-24 border-b border-slate-200">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-3 text-base text-slate-600 max-w-2xl mx-auto">
            Clear answers about our courses, 24/7 mentors, free open notes, and paid teaching opportunities.
          </p>
        </div>

        <div className="mt-12 space-y-4">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="rounded-xl border border-slate-200 bg-white transition hover:border-slate-300 overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 p-5 sm:p-6 text-left transition"
                >
                  <span className="font-display text-base sm:text-lg font-semibold text-ink-900">
                    {faq.question}
                  </span>
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-transform duration-200 ${
                      isOpen ? "rotate-180 bg-brand-50 text-brand-700" : ""
                    }`}
                  >
                    <ExpandMore fontSize="small" />
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 px-5 pb-6 pt-3 sm:px-6 text-sm sm:text-base leading-relaxed text-slate-600 animate-in fade-in duration-150">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
