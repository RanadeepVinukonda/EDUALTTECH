"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ArrowBack from "@mui/icons-material/ArrowBack";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Close from "@mui/icons-material/Close";
import WorkspacePremium from "@mui/icons-material/WorkspacePremium";
import CoverImage from "@/components/ui/CoverImage";
import { initialsFromName } from "@/lib/name";
import { TEAM, type TeamMember } from "@/lib/team";
import { cn } from "@/lib/cn";

const CARD_TILTS = [
  "-rotate-2",
  "rotate-[1.5deg]",
  "-rotate-[1deg]",
  "rotate-2",
  "-rotate-[1.5deg]",
  "rotate-[1deg]",
  "-rotate-2",
  "rotate-[1.5deg]",
  "-rotate-[1deg]",
  "rotate-2",
  "-rotate-[1.5deg]",
];

const VERTICAL_OFFSETS = [
  "lg:translate-y-0",
  "lg:translate-y-3",
  "lg:-translate-y-0.5",
  "lg:translate-y-2.5",
];

function splitRoles(title: string): string[] {
  return title
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function craftNote(member: TeamMember): string {
  const t = member.title.toLowerCase();
  if (t.includes("founder")) {
    return "Guiding EduAltTech's vision across partner schools, mentored cohorts, and practical curriculum programs.";
  }
  if (t.includes("ai development")) {
    return "Coordinating active programs while building applied AI modules and hands-on learning tools.";
  }
  if (t.includes("full stack") && t.includes("client relations")) {
    return "Engineering full-stack features while partnering directly with schools, learners, and mentors.";
  }
  if (t.includes("full stack")) {
    return "Building the EduAltTech platform end-to-end — from digital classrooms to mentor workflows.";
  }
  if (t.includes("frontend")) {
    return "Crafting clean, responsive interfaces and smooth interactive learning experiences.";
  }
  if (t.includes("graphic designer")) {
    return "Shaping EduAltTech's visual identity, course artwork, and creative storytelling.";
  }
  if (t.includes("project coordinator")) {
    return "Coordinating cohorts, timelines, and school partnerships so every program runs smoothly.";
  }
  if (t.includes("client relations")) {
    return "Connecting schools, parents, and learners with the right EduAltTech programs.";
  }
  return "Building practical courses and mentoring experiences at EduAltTech.";
}

export default function TeamShowcase({
  showHeader = true,
}: {
  showHeader?: boolean;
}) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const reduceMotion = useReducedMotion();

  const selectedMember = selectedIndex !== null ? TEAM[selectedIndex] : null;

  const openPrev = () => {
    setSelectedIndex((prev) =>
      prev === null ? 0 : (prev - 1 + TEAM.length) % TEAM.length,
    );
  };

  const openNext = () => {
    setSelectedIndex((prev) =>
      prev === null ? 0 : (prev + 1) % TEAM.length,
    );
  };

  return (
    <div>
      {showHeader && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-mono font-semibold uppercase tracking-[0.14em] text-brand-700">
              Studio Wall · {TEAM.length} Builders &amp; Mentors
            </p>
            <h2 className="mt-2 max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
              The people behind EduAltTech.
            </h2>
            <p className="mt-2.5 max-w-lg text-base leading-relaxed text-ink-2">
              The educators, builders, designers, and coordinators behind every course. Hover a frame or tap any portrait to meet them up close.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-rule bg-[#ffffff] px-3.5 py-1.5 text-xs font-medium text-ink-2 shadow-elev1">
            <span className="h-2 w-2 rounded-full bg-brand-500" aria-hidden="true" />
            Click any portrait to inspect
          </span>
        </div>
      )}

      {/* Dot-Grid Creative Studio Pinboard Canvas */}
      <div
        className={cn(
          "relative rounded-3xl border border-rule bg-paper-2/70 p-5 sm:p-7 lg:pb-10",
          showHeader ? "mt-8" : "mt-2",
        )}
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15, 32, 39, 0.09) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-7 md:grid-cols-4 lg:grid-cols-5">
          {TEAM.map((member, index) => {
            const isFounder = /founder/i.test(member.title);
            const tilt = reduceMotion ? "" : CARD_TILTS[index % CARD_TILTS.length];
            const offset = reduceMotion ? "" : VERTICAL_OFFSETS[index % VERTICAL_OFFSETS.length];
            const roles = splitRoles(member.title);

            return (
              <li
                key={member.name}
                className={cn("relative transition-transform duration-300", offset)}
              >
                <button
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={cn(
                    "group relative flex w-full cursor-pointer flex-col rounded-xl border bg-[#ffffff] p-2 pb-3 text-left shadow-elev2 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-20 hover:rotate-0 hover:-translate-y-1.5 hover:scale-[1.04] hover:shadow-elev3 focus-visible:z-20 focus-visible:rotate-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2",
                    tilt,
                    isFounder
                      ? "border-brand-300 ring-2 ring-brand-500/15 hover:border-brand-500"
                      : "border-rule/90 hover:border-brand-400",
                  )}
                >
                  {/* Decorative pin dot */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "mx-auto mb-1.5 block h-2 w-2 rounded-full shadow-inner ring-2 ring-white",
                      isFounder ? "bg-amber-500" : "bg-brand-600/80",
                    )}
                  />

                  {/* Portrait Photo Frame */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-paper-2">
                    <CoverImage
                      src={member.image}
                      alt={`Portrait of ${member.name}`}
                      fallback={initialsFromName(member.name)}
                      className="h-full w-full object-cover object-top grayscale-[22%] transition-all duration-500 group-hover:scale-[1.05] group-hover:grayscale-0"
                    />

                    {/* Index Stamp */}
                    <span className="absolute left-1.5 top-1.5 rounded bg-[#ffffff]/90 px-1.5 py-0.5 font-mono text-[9px] font-semibold text-ink shadow-elev1 backdrop-blur-sm">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    {isFounder && (
                      <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full border border-amber-200 bg-amber-50/95 px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-900 shadow-elev1 backdrop-blur-sm">
                        <WorkspacePremium sx={{ fontSize: 10 }} aria-hidden />
                        Founder
                      </span>
                    )}
                  </div>

                  {/* Polaroid Caption Footer */}
                  <div className="mt-2 px-0.5">
                    <div className="flex items-baseline justify-between gap-1.5">
                      <h3 className="truncate font-display text-sm font-semibold capitalize text-ink transition-colors group-hover:text-brand-800">
                        {member.name}
                      </h3>
                      <ArrowForward
                        sx={{ fontSize: 13 }}
                        aria-hidden
                        className="shrink-0 text-brand-600 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100"
                      />
                    </div>
                    <p className="mt-0.5 line-clamp-2 font-mono text-[10px] leading-snug text-muted">
                      {roles.join(" · ")}
                    </p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Interactive Polaroid Quick-Look Lightbox */}
      <AnimatePresence>
        {selectedMember && selectedIndex !== null && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSelectedIndex(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/70 p-4 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`Profile of ${selectedMember.name}`}
          >
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-rule bg-[#ffffff] shadow-2xl"
            >
              <button
                type="button"
                onClick={() => setSelectedIndex(null)}
                aria-label="Close profile"
                className="absolute right-4 top-5 z-10 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-rule bg-[#ffffff] text-ink-2 shadow-elev1 transition-colors hover:bg-paper-2 hover:text-ink"
              >
                <Close sx={{ fontSize: 18 }} aria-hidden />
              </button>

              <div className="grid gap-6 p-6 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center sm:p-8">
                <div className="mx-auto w-48 overflow-hidden rounded-2xl border border-rule bg-paper-2 shadow-elev1 sm:w-full">
                  <div className="aspect-[4/5] w-full">
                    <CoverImage
                      src={selectedMember.image}
                      alt={`Portrait of ${selectedMember.name}`}
                      fallback={initialsFromName(selectedMember.name)}
                      className="h-full w-full object-cover object-top"
                    />
                  </div>
                </div>

                <div className="min-w-0">
                  <span className="font-mono text-xs font-semibold uppercase tracking-widest text-brand-700">
                    Member {String(selectedIndex + 1).padStart(2, "0")} of {TEAM.length}
                  </span>
                  <h3 className="mt-2 font-display text-3xl font-semibold capitalize text-ink">
                    {selectedMember.name}
                  </h3>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {splitRoles(selectedMember.title).map((role) => (
                      <span
                        key={role}
                        className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-900"
                      >
                        {role}
                      </span>
                    ))}
                  </div>

                  <p className="mt-4 text-sm leading-relaxed text-ink-2 sm:text-base">
                    {craftNote(selectedMember)}
                  </p>

                  <div className="mt-6 flex items-center justify-between border-t border-rule pt-4">
                    <span className="text-xs font-medium text-muted">EduAltTech · Setsuzoku</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={openPrev}
                        aria-label="Previous member"
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-rule bg-paper text-ink transition-colors hover:border-brand-400 hover:bg-brand-50"
                      >
                        <ArrowBack sx={{ fontSize: 16 }} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={openNext}
                        aria-label="Next member"
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-rule bg-paper text-ink transition-colors hover:border-brand-400 hover:bg-brand-50"
                      >
                        <ArrowForward sx={{ fontSize: 16 }} aria-hidden />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
