"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { buttonClass } from "@/components/ui/Button";

const EASE = [0.2, 0.8, 0.2, 1] as const;

const fade = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: EASE },
  }),
};

export default function Hero() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-12 lg:items-center lg:gap-16 lg:px-8">
        <div className="lg:col-span-6">
          <motion.h1
            custom={0}
            variants={fade}
            initial="hidden"
            animate="visible"
            className="max-w-xl font-display text-[2.6rem] font-semibold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl lg:text-[3.4rem]"
          >
            Learn practical skills from people who do the work.
          </motion.h1>

          <motion.p
            custom={1}
            variants={fade}
            initial="hidden"
            animate="visible"
            className="mt-6 max-w-lg text-base leading-relaxed text-ink-600 sm:text-lg"
          >
            Structured courses in applied AI, software, entrepreneurship, music, and dance.
            Follow a clear roadmap, build real work, and get feedback from a working mentor.
          </motion.p>

          <motion.div
            custom={2}
            variants={fade}
            initial="hidden"
            animate="visible"
            className="mt-9 flex flex-wrap gap-3"
          >
            <Link href="/courses" className={buttonClass("primary", "lg")}>
              Explore courses
              <ArrowForward fontSize="small" aria-hidden />
            </Link>
            <Link href="/mentor" className={buttonClass("secondary", "lg")}>
              Teach and earn
            </Link>
          </motion.div>

          <motion.p
            custom={3}
            variants={fade}
            initial="hidden"
            animate="visible"
            className="mt-10 border-t border-slate-200 pt-5 text-sm text-slate-500"
          >
            Free open notes for everyone. Paid courses include a mentor and a structured roadmap.
          </motion.p>
        </div>

        <motion.figure
          className="lg:col-span-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/photos/EAT3.jpg"
              alt="A mentor working with students at EduAltTech"
              className="aspect-[4/3] w-full object-cover lg:aspect-[5/4]"
            />
          </div>
          <figcaption className="mt-3 flex items-center justify-between gap-4 text-xs text-slate-500">
            <span>In classrooms and online</span>
            <span>Kakinada, India</span>
          </figcaption>
        </motion.figure>
      </div>
    </section>
  );
}
