"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, Rocket, Lightbulb, X } from "lucide-react";
import { getCachedUser, subscribeAuth } from "@/lib/api";

interface CareerPath {
  match: RegExp;
  title: string;
  blurb: string;
}

// ponytail: static keyword map — recommends paths from declared interests. No LLM.
const CAREER_PATHS: CareerPath[] = [
  { match: /program|code|web|django|react|python|javascript|dsa|developer|app/i, title: "Software & web development", blurb: "Start with a programming course, grind practice labs, then teach a chapter to cement it." },
  { match: /data|sql|ml|machine|ai/i, title: "Data science & analytics", blurb: "Pair a stats base with coding; apply for projects that publish numbers." },
  { match: /physics|circuit|electronics/i, title: "Engineering & physics tracks", blurb: "Pick one domain (electrical, mechanical, electronics) and follow practitioners in it." },
  { match: /chem/i, title: "Chemical science tracks", blurb: "Lab-first: theory + practicals. Look for mentors teaching applied chemistry." },
  { match: /bio|biology|medicine|medical|health/i, title: "Life sciences & medicine", blurb: "Build a biology base now; entrance prep (NEET) is a separate sprint on top." },
  { match: /math|maths|mathematics|quant/i, title: "Math → data, finance, or engineering", blurb: "Math is a language — keep daily practice and let it flex into finance or data." },
  { match: /english|spoken|communication|writing|content/i, title: "Communication & content careers", blurb: "Coach spoken English now — it compounds into teaching, media and product roles." },
  { match: /gate|jee|neet|exam|entrance|competitive/i, title: "Exam-prep sprint (GATE / JEE / NEET)", blurb: "Treat exam prep like a project: syllabus, mock tests, weekly review. A mentor keeps it on track." },
  { match: /design|ui|ux|creative|draw/i, title: "Design & UX", blurb: "Practice daily and build a small portfolio; a portfolio beats a certificate." },
  { match: /business|startup|entrepreneur|sales|marketing/i, title: "Business, sales & marketing", blurb: "Learn by doing: sell a small thing, run a small campaign, then study frameworks." },
];

function matchPaths(interests: string[]): CareerPath[] {
  const seen = new Set<string>();
  const out: CareerPath[] = [];
  for (const topic of interests) {
    for (const p of CAREER_PATHS) {
      if (!seen.has(p.title) && p.match.test(topic)) {
        seen.add(p.title);
        out.push(p);
      }
    }
  }
  return out.slice(0, 3);
}

const STUDY_TIPS = [
  "Small daily reps beat weekend marathons — 20 minutes of practice every day.",
  "Teach what you just learned to a friend; it doubles recall.",
  "Pick one course, finish it, don't stack five half-dones.",
];

export function GuideBubble() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<ReturnType<typeof getCachedUser>>(null);

  useEffect(() => setUser(getCachedUser()), [open]);
  useEffect(() => subscribeAuth(() => setUser(getCachedUser())), []);

  const firstName = user?.name.split(" ")[0] ?? "";
  const paths = user?.interestedTopics.length ? matchPaths(user.interestedTopics) : [];

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {open && (
        <div className="mb-3 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <header className="flex items-center justify-between brand-grad px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-white">
              <Compass className="h-4 w-4" /> {user ? `Hi ${firstName} — your guide` : "New around here?"}
            </p>
            <button onClick={() => setOpen(false)} aria-label="Close guide" className="text-white/70 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="max-h-[60vh] space-y-4 overflow-y-auto p-4 text-sm">
            {!user ? (
              <>
                <p className="text-slate-600">Three steps to your first classroom:</p>
                <ol className="space-y-2 text-slate-700">
                  <li className="rounded-xl bg-slate-50 p-3">
                    <span className="font-semibold">1 · Create an account</span>
                    <p className="text-xs text-slate-500">Name, email (verify with a 6-digit code), done.</p>
                  </li>
                  <li className="rounded-xl bg-slate-50 p-3">
                    <span className="font-semibold">2 · Pick a course & mentor</span>
                    <p className="text-xs text-slate-500">Every course is run by a mentor you can also become.</p>
                  </li>
                  <li className="rounded-xl bg-slate-50 p-3">
                    <span className="font-semibold">3 · Learn, practice, ask</span>
                    <p className="text-xs text-slate-500">Live classes, practice labs and a classroom chat inside your course.</p>
                  </li>
                </ol>
                <div className="flex gap-2">
                  <Link href="/register" onClick={() => setOpen(false)} className="flex-1 rounded-lg brand-grad px-3 py-2 text-center font-semibold text-white hover:bg-brand-700">
                    Sign up
                  </Link>
                  <Link href="/courses" onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-center font-semibold text-slate-600 hover:border-brand-400">
                    Browse courses
                  </Link>
                </div>
              </>
            ) : (
              <>
                {paths.length > 0 ? (
                  <div>
                    <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                      <Rocket className="h-4 w-4 text-brand-600" /> Suggested paths for you
                    </p>
                    <ul className="mt-2 space-y-2">
                      {paths.map((p) => (
                        <li key={p.title} className="rounded-xl border border-brand-100 bg-brand-50 p-3">
                          <p className="font-semibold text-brand-900">{p.title}</p>
                          <p className="mt-0.5 text-xs text-brand-800/80">{p.blurb}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div>
                    <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                      <Rocket className="h-4 w-4 text-brand-600" /> Shape your path
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Tell us your interests (signup or{" "}
                      <Link href="/onboarding" className="font-semibold text-brand-700 hover:text-brand-800">onboarding</Link>) and we&apos;ll recommend career paths — no AI, just a match on what you care about.
                    </p>
                  </div>
                )}

                <div>
                  <p className="font-semibold text-slate-900">Mentoring guidance</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {user.isProvider
                      ? "You're already mentoring — teach one idea per chapter, answer classroom chat daily, and record sessions so learners can rewatch."
                      : "Everything you study you can teach: pick any course, hit “Mentor this course” on its page, and apply — the roadmap is yours to build after approval."}
                  </p>
                </div>

                <div>
                  <p className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <Lightbulb className="h-4 w-4 text-amber-500" /> Quick tips
                  </p>
                  <ul className="mt-1 space-y-1 text-xs text-slate-600">
                    {STUDY_TIPS.map((t) => (
                      <li key={t}>· {t}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open guide"
        aria-expanded={open}
        className="ml-auto flex items-center gap-2 rounded-full brand-grad px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 hover:bg-brand-700"
      >
        <Compass className="h-5 w-5" />
        {open ? "Close" : "Guide"}
      </button>
    </div>
  );
}