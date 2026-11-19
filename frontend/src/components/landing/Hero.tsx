"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ArrowForward from "@mui/icons-material/ArrowForward";
import Terminal from "@mui/icons-material/Terminal";
import Explore from "@mui/icons-material/Explore";
import LibraryBooks from "@mui/icons-material/LibraryBooks";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { buttonClass } from "@/components/ui/Button";

const ROTATING_WORDS = [
  "syllabus.",
  "textbook.",
  "classroom.",
  "ordinary.",
  "limits.",
];

const HERO_PILLARS = [
  {
    title: "Mentor-led",
    detail: "Live online & partner school classrooms",
    Icon: Explore,
  },
  {
    title: "Practical tracks",
    detail: "Applied AI, engineering & creative arts",
    Icon: Terminal,
  },
  {
    title: "Open notes",
    detail: "Free structured resources with no login",
    Icon: LibraryBooks,
  },
];

export default function Hero() {
  const [wordIndex, setWordIndex] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) return;
    const interval = window.setInterval(() => {
      setWordIndex((prev) => (prev + 1) % ROTATING_WORDS.length);
    }, 2400);
    return () => window.clearInterval(interval);
  }, [reduceMotion]);

  return (
    <section className="border-b border-rule bg-paper">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:gap-12 lg:px-8 lg:py-20">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-x-[0.26em] font-display text-[clamp(1.65rem,2.85vw,2.65rem)] font-semibold leading-[1.2] tracking-tight text-ink-900 sm:flex-nowrap">
            <span className="whitespace-nowrap">Learn beyond the</span>
            <span className="relative inline-grid h-[1.2em] overflow-hidden text-brand-600 [perspective:600px]">
              <span className="invisible col-start-1 row-start-1 select-none" aria-hidden="true">
                classroom.
              </span>
              <AnimatePresence initial={false}>
                <motion.span
                  key={ROTATING_WORDS[wordIndex]}
                  initial={reduceMotion ? false : { y: "100%", opacity: 0, rotateX: -45 }}
                  animate={{ y: "0%", opacity: 1, rotateX: 0 }}
                  exit={reduceMotion ? undefined : { y: "-100%", opacity: 0, rotateX: 45 }}
                  transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
                  className="col-start-1 row-start-1 whitespace-nowrap origin-center"
                >
                  {ROTATING_WORDS[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>
          </h1>

          <p className="mt-5 max-w-[46ch] text-base leading-relaxed text-ink-2 sm:text-lg">
            Explore technical and creative courses with working mentors, hands-on projects, verified certificates, and free open resources.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/courses" className={buttonClass("primary", "lg")}>
              Explore courses
              <ArrowForward fontSize="small" aria-hidden />
            </Link>
            <Link href="/resources" className={buttonClass("secondary", "lg")}>
              Browse free resources
            </Link>
          </div>

          <dl className="mt-8 grid grid-cols-1 gap-3.5 border-t border-rule pt-6 sm:grid-cols-3">
            {HERO_PILLARS.map(({ title, detail, Icon }) => (
              <div
                key={title}
                className="rounded-xl border border-rule/80 bg-[#ffffff] p-3.5 shadow-elev1"
              >
                <dt className="flex items-center gap-2 font-display text-sm font-semibold text-ink">
                  <Icon sx={{ fontSize: 16 }} className="shrink-0 text-brand-600" aria-hidden />
                  <span>{title}</span>
                </dt>
                <dd className="mt-1 text-xs leading-relaxed text-ink-2">{detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <figure className="min-w-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-paper-2 shadow-elev2 ring-1 ring-ink/10 lg:aspect-[5/4]">
            <Image
              src="/media/photos/EAT3.jpg"
              alt="A mentor working with students at EduAltTech"
              width={1600}
              height={1200}
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority
              className="h-full w-full object-cover"
            />
          </div>
          <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-muted">
            <span>In classrooms and online</span>
            <span>Kakinada, India</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
