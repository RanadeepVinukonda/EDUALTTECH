"use client";

import Link from "next/link";
import Image from "next/image";
import ArrowForward from "@mui/icons-material/ArrowForward";
import { buttonClass } from "@/components/ui/Button";

export default function Hero() {
  return (
    <section className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto grid min-h-[calc(100svh_-_4rem)] max-w-7xl grid-cols-1 items-center gap-10 px-4 py-10 sm:px-6 sm:py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-8 lg:py-12">
        <div className="min-w-0">
          {/* Status & MSME Accreditation Badges */}
          <div className="flex flex-wrap items-center gap-2.5 mb-5">
            {/* Live Cohort Status Pill */}
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50/90 px-3.5 py-1 text-xs font-medium text-brand-900 shadow-2xs backdrop-blur-sm">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-600" />
              </span>
              <span>Practical education · In classrooms &amp; live online</span>
            </div>

            {/* MSME Approved Government of India Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-rule/80 bg-white/95 px-3 py-1 text-xs font-medium text-ink shadow-2xs backdrop-blur-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/media/logos/msme-seeklogo.png"
                alt="MSME Government of India Logo"
                className="h-4.5 w-auto object-contain"
                width={18}
                height={18}
              />
              <span className="font-semibold text-ink">MSME Approved</span>
              <span className="text-[11px] font-mono text-muted">Govt. of India</span>
            </div>
          </div>

          <h1 className="max-w-[12ch] font-display text-4xl font-semibold leading-[1.05] tracking-tight text-ink-900 sm:text-5xl lg:text-[4.25rem]">
            Learn beyond the syllabus.
          </h1>

          <p className="mt-5 max-w-[42ch] text-base leading-relaxed text-ink-600 sm:text-lg">
            Explore technical and creative courses with working mentors and free resources.
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

        </div>

        <figure className="min-w-0">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200 lg:aspect-[5/4]">
            <Image
              src="/media/photos/EAT3.jpg"
              alt="A mentor working with students at EduAltTech"
              width={1600}
              height={1200}
              sizes="(min-width: 1024px) 55vw, 100vw"
              priority
              className="h-full w-full object-cover"
            />
          </div>
          <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm text-slate-500">
            <span>In classrooms and online</span>
            <span>Kakinada, India</span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
