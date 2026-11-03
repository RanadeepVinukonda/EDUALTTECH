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
