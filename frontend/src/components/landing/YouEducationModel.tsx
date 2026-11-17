"use client";

import { useState } from "react";
import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Psychology from "@mui/icons-material/Psychology";
import Explore from "@mui/icons-material/Explore";
import EmojiEvents from "@mui/icons-material/EmojiEvents";
import Terminal from "@mui/icons-material/Terminal";
import Lightbulb from "@mui/icons-material/Lightbulb";
import SportsEsports from "@mui/icons-material/SportsEsports";
import Palette from "@mui/icons-material/Palette";
import MusicNote from "@mui/icons-material/MusicNote";
import FitnessCenter from "@mui/icons-material/FitnessCenter";
import Agriculture from "@mui/icons-material/Agriculture";
import Handshake from "@mui/icons-material/Handshake";
import WorkspacePremium from "@mui/icons-material/WorkspacePremium";
import CheckCircle from "@mui/icons-material/CheckCircle";
import { cn } from "@/lib/cn";

interface Pillar {
  id: "Y" | "O" | "U";
  step: "01" | "02" | "03";
  letter: string;
  name: string;
  tagline: string;
  originalBlueprint: string;
  narrative: string;
  icon: typeof Psychology;
  actionTitle: string;
  concreteDeliverables: {
    title: string;
    description: string;
    tag: string;
  }[];
}

const PILLARS: Pillar[] = [
  {
    id: "Y",
    step: "01",
    letter: "Y",
    name: "Your Potential",
    tagline: "Discover yourself",
    originalBlueprint: "Discover individual interests, talents, and strengths.",
    narrative:
      "Conventional education treats students like identical factory units, testing standardized recall rather than innate capability. We begin by listening: identifying where your genuine curiosity lies, how your logic works, and what kinds of problems make you lose track of time.",
    icon: Psychology,
    actionTitle: "The Diagnostic: Four Learner Profiles",
    concreteDeliverables: [
      {
        title: "Algorithmic & Systems Logic",
        description: "A natural instinct for patterns, control flow, data pipelines, and backend architectures.",
        tag: "Analytical",
      },
      {
        title: "Spatial & Interactive Design",
        description: "An intuitive eye for usability, visual balance, color systems, and modern UI/UX design.",
        tag: "Creative",
      },
      {
        title: "Venture & Problem Discovery",
        description: "An appetite for recognizing real customer needs, business models, and startup viability.",
        tag: "Entrepreneurial",
      },
      {
        title: "Kinesthetic & Environmental Craft",
        description: "Curiosity for physical systems, sound synthesis, athletic discipline, and sustainable agriculture.",
        tag: "Hands-on",
      },
    ],
  },
  {
    id: "O",
    step: "02",
    letter: "O",
    name: "Opportunity to Explore",
    tagline: "Explore possibilities",
    originalBlueprint: "Explore AI, technology, entrepreneurship, game development and creative fields.",
    narrative:
      "Practical capability is never confined to an academic silo. We open the full horizon: connecting foundational engineering and artificial intelligence with creative expression, entrepreneurship, athletic discipline, and sustainable sciences.",
    icon: Explore,
    actionTitle: "The Exploration Spectrum: Concrete Tracks",
    concreteDeliverables: [
      {
        title: "Applied AI & Engineering",
        description: "Python, neural architectures, LLM orchestration, APIs, and production web applications.",
        tag: "Core Tech",
      },
      {
        title: "Game Dev & Interactive Logic",
        description: "Physics loops, 2D/3D engines (Godot/Unity), mechanics design, and interactive storytelling.",
        tag: "Interactive",
      },
      {
        title: "Tech Entrepreneurship",
        description: "Customer discovery interviews, rapid prototyping, financial modeling, and early sales.",
        tag: "Venture",
      },
      {
        title: "Alternative & Life Skills",
        description: "UI/UX in Figma, music production, athletic discipline, and sensor-driven agriculture.",
        tag: "Creative & Arts",
      },
    ],
  },
  {
    id: "U",
    step: "03",
    letter: "U",
    name: "Unlock Your Future",
    tagline: "Unlock your future",
    originalBlueprint: "Apply knowledge through projects, problem solving, innovation and real-world experiences.",
    narrative:
      "Theory without execution produces zero durable capability. You graduate not with multiple-choice test scores, but with live deployed software, working prototypes, practitioner code critiques, and a verifiable public portfolio.",
    icon: EmojiEvents,
    actionTitle: "The Four Deliverables of Graduation",
    concreteDeliverables: [
      {
        title: "1. Documented Code Repository",
        description: "Public GitHub commits demonstrating clean architecture, tests, and genuine implementation.",
        tag: "Proof of Work",
      },
      {
        title: "2. Live Deployed Product",
        description: "A functional application or prototype running live on the web or tested in physical classrooms.",
        tag: "Production",
      },
      {
        title: "3. Practitioner Code Critique",
        description: "Line-by-line code reviews and architecture feedback from working software engineers.",
        tag: "Peer Review",
      },
      {
        title: "4. Verified Project Certificate",
        description: "A permanent credential that links directly to your public repository and live project.",
        tag: "Verifiable",
      },
    ],
  },
];

const MULTIDISCIPLINARY_DOMAINS = [
  { icon: Terminal, name: "Applied AI & Code", desc: "Python, Neural concepts, Web Systems", kicker: "Core Track" },
  { icon: Lightbulb, name: "Entrepreneurship", desc: "Customer validation, MVPs, Unit Economics", kicker: "Venture" },
  { icon: SportsEsports, name: "Game Development", desc: "Physics loops, Mechanics, Game Engines", kicker: "Interactive" },
  { icon: Palette, name: "UI/UX & Prototyping", desc: "Figma, Design Systems, Usability", kicker: "Creative" },
  { icon: MusicNote, name: "Music & Sound", desc: "Digital audio, Synthesis, Audio Craft", kicker: "Alternative" },
  { icon: FitnessCenter, name: "Athletic Discipline", desc: "Kinesthetic focus, Strategy & Teamwork", kicker: "Life Skill" },
  { icon: Agriculture, name: "Agri-Tech & Nature", desc: "IoT sensors, Soil intelligence, Ecology", kicker: "Hands-on" },
  { icon: Handshake, name: "Real-World Skills", desc: "Negotiation, Public Voice, Ethics", kicker: "Foundational" },
];

/**
 * The Y.O.U. Education Model
 * Built to the Hallmark & Impeccable standard (Anti-slop):
 * Grounded in the original handwritten blueprint from Kakinada.
 * Displays tactile ruled notebook lines, concrete learner diagnostic,
 * clear multidisciplinary matrix, and tangible deliverables of proof.
 */
export default function YouEducationModel() {
  const [activeId, setActiveId] = useState<"Y" | "O" | "U">("Y");
  const activePillar = PILLARS.find((p) => p.id === activeId) ?? PILLARS[0];
  const ActiveIcon = activePillar.icon;

  return (
    <section
      id="you-model"
      aria-labelledby="you-model-heading"
      className="relative border-b border-rule bg-paper-2/40 py-16 sm:py-24 overflow-hidden"
    >
      {/* Subtle Hallmark dot matrix for technical depth */}
      <div className="pointer-events-none absolute inset-0 hallmark-dot-grid opacity-35" aria-hidden="true" />

      {/* Atmospheric ambient warmth */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,oklch(93%_0.035_150/0.45),transparent_75%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header: Hallmark Restraint & Posture */}
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 pb-8 border-b border-rule">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200/90 bg-white/90 px-3.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-brand-900 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-600 animate-pulse" />
              The Pedagogical Blueprint · Kakinada
            </div>

            <h2
              id="you-model-heading"
              className="mt-4 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-[1.08]"
            >
              Education centered on <span className="text-brand-700 italic font-serif">who you are</span>.
            </h2>
          </div>

          <div className="max-w-md lg:text-right">
            <p className="font-display text-sm sm:text-base font-semibold text-ink">
              Discover yourself. Explore possibilities. Unlock your future.
            </p>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              A human pedagogical framework born out of frustration with factory-style syllabus completion.
            </p>
          </div>
        </div>

        {/* Tactile Y-O-U Monolith Pillar Selector */}
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PILLARS.map((pillar) => {
            const isSelected = pillar.id === activeId;
            return (
              <button
                key={pillar.id}
                type="button"
                onClick={() => setActiveId(pillar.id)}
                className={cn(
                  "group relative flex items-start gap-4 rounded-2xl border p-5 sm:p-6 text-left transition-all duration-300",
                  isSelected
                    ? "border-brand-700 bg-white shadow-sm ring-1 ring-brand-700/20"
                    : "border-rule/80 bg-paper/70 hover:border-slate-300 hover:bg-white",
                )}
                aria-pressed={isSelected}
              >
                {/* Architectural Monolith Character */}
                <span
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-display text-2xl font-bold transition-all",
                    isSelected
                      ? "bg-brand-700 text-white shadow-sm"
                      : "bg-paper-2 text-ink-2 group-hover:bg-brand-50 group-hover:text-brand-800",
                  )}
                >
                  {pillar.letter}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-base font-bold text-ink">
                      {pillar.name}
                    </span>
                    <span className="font-mono text-xs font-semibold text-muted">
                      {pillar.step}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted font-medium">
                    {pillar.tagline}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Pillar Canvas: Dual Column (Blueprint + Tangible Practice) */}
        <div className="mt-6 overflow-hidden rounded-3xl border border-rule bg-white shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Column: The Human Philosophy & Handwritten Blueprint Callout */}
            <div className="p-7 sm:p-10 lg:col-span-7 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-rule">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2.5 py-1 text-xs font-mono font-semibold uppercase tracking-wider text-brand-800">
                    <ActiveIcon sx={{ fontSize: 15 }} className="text-brand-700" />
                    Pillar {activePillar.step} · {activePillar.name}
                  </span>
                </div>

                <h3 className="mt-4 font-display text-2xl sm:text-3xl font-bold tracking-tight text-ink">
                  {activePillar.tagline}
                </h3>

                {/* The Tactile Ruled-Notebook Callout (Honoring the User's Real Note) */}
                <div className="mt-5 rounded-2xl border border-amber-200/80 bg-amber-50/40 p-5 sm:p-6 ruled-notebook-paper">
                  <div className="flex items-center justify-between text-[11px] font-mono font-semibold uppercase tracking-wider text-amber-900">
                    <span>✍️ Founder&apos;s Original Notebook Note</span>
                    <span>Kakinada, AP</span>
                  </div>
                  <blockquote className="mt-3 font-serif text-base sm:text-lg italic text-slate-800 leading-snug">
                    &ldquo;{activePillar.originalBlueprint}&rdquo;
                  </blockquote>
                </div>

                <p className="mt-5 text-sm sm:text-base leading-relaxed text-muted">
                  {activePillar.narrative}
                </p>
              </div>

              {/* Bottom Assurance */}
              <div className="mt-8 pt-6 border-t border-rule flex flex-wrap items-center justify-between gap-4">
                <span className="text-xs font-medium text-muted">
                  Active in physical Kakinada classrooms &amp; live online cohorts.
                </span>
                <Link
                  href="/courses"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 hover:text-brand-800 transition"
                >
                  Explore matching roadmaps
                  <ArrowForward sx={{ fontSize: 13 }} aria-hidden />
                </Link>
              </div>
            </div>

            {/* Right Column: Impeccable Tangible Deliverables / Diagnostic Cards */}
            <div className="bg-paper p-7 sm:p-10 lg:col-span-5 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted block mb-4">
                  {activePillar.actionTitle}
                </span>

                <div className="space-y-3">
                  {activePillar.concreteDeliverables.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-rule/80 bg-white p-4 shadow-2xs transition hover:border-brand-300"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <CheckCircle sx={{ fontSize: 15 }} className="text-brand-600 shrink-0" />
                          <h4 className="text-xs sm:text-sm font-semibold text-ink">
                            {item.title}
                          </h4>
                        </div>
                        <span className="rounded-md bg-paper-2 px-2 py-0.5 text-[10px] font-mono font-medium text-muted">
                          {item.tag}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted pl-6">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Verified Guarantee Pill */}
              <div className="mt-6 flex items-center justify-between rounded-xl bg-white px-4 py-3 border border-rule/70">
                <div className="flex items-center gap-2">
                  <WorkspacePremium sx={{ fontSize: 16 }} className="text-brand-700" />
                  <span className="text-xs font-semibold text-ink">Zero Rote Memorization</span>
                </div>
                <span className="text-[11px] font-mono text-brand-800 font-medium">100% Artifact-Based</span>
              </div>
            </div>
          </div>
        </div>

        {/* Multidisciplinary Spectrum: 8 Distinct Real-World Disciplines */}
        <div className="mt-12 rounded-3xl border border-rule bg-white p-6 sm:p-10 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 pb-6 border-b border-rule">
            <div>
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-700">
                Opportunity to Explore
              </span>
              <h3 className="mt-1 font-display text-xl sm:text-2xl font-bold text-ink">
                Technology, Entrepreneurship, and Alternative Life Skills
              </h3>
            </div>
            <p className="max-w-md text-xs sm:text-sm text-muted leading-relaxed">
              We teach modern engineering alongside creative arts and foundational life skills that standard curricula leave behind.
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
            {MULTIDISCIPLINARY_DOMAINS.map((domain) => {
              const DomainIcon = domain.icon;
              return (
                <div
                  key={domain.name}
                  className="group rounded-2xl border border-rule/70 bg-paper/50 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-300 hover:bg-white hover:shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-ink-2 shadow-2xs border border-rule group-hover:bg-brand-50 group-hover:text-brand-800">
                      <DomainIcon sx={{ fontSize: 18 }} />
                    </div>
                    <span className="rounded-full bg-paper-2 px-2 py-0.5 text-[9.5px] font-mono font-medium text-muted">
                      {domain.kicker}
                    </span>
                  </div>
                  <h4 className="mt-3 text-xs sm:text-sm font-semibold text-ink group-hover:text-brand-800 transition-colors">
                    {domain.name}
                  </h4>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted">
                    {domain.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Tagline Manifesto Banner: Hallmark High Contrast */}
        <div className="mt-8 rounded-3xl border border-brand-800 bg-gradient-to-r from-brand-950 via-brand-900 to-emerald-950 p-7 sm:p-10 text-white shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-2xl space-y-2">
              <span className="text-xs font-mono font-semibold uppercase tracking-widest text-brand-300">
                The EduAltTech Manifesto
              </span>
              <h3 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white leading-tight">
                Discover yourself. Explore Possibilities. Unlock your Future.
              </h3>
              <p className="text-xs sm:text-sm text-brand-100/90 leading-relaxed">
                Whether you are discovering your first line of code, building a startup prototype, exploring sound design, or mentoring young minds for paid livelihood, your journey begins here.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center rounded-xl bg-white px-5 py-3 text-xs sm:text-sm font-semibold text-brand-950 shadow-sm transition hover:bg-brand-50"
              >
                Browse All Courses
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 backdrop-blur px-5 py-3 text-xs sm:text-sm font-semibold text-white transition hover:bg-white/20"
              >
                Explore School Programs
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
