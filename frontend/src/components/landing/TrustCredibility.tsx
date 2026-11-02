import Link from "next/link";
import ArrowForward from "@mui/icons-material/ArrowForward";
import PartnerStrip from "./PartnerStrip";

const CLASSROOM_PHOTOS = [
  { src: "/media/photos/EAT2.jpg", alt: "A hands-on learning session at EduAltTech", caption: "On-site lab sessions" },
  { src: "/media/photos/EAT3.jpg", alt: "A mentor working with students at EduAltTech", caption: "Small-cohort problem solving" },
  { src: "/media/photos/EAT4.jpg", alt: "A student building projects during an EduAltTech class", caption: "Applied practice across skills" },
];

export default function TrustCredibility() {
  return (
    <section className="border-b border-slate-200 bg-white py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl lg:col-span-7">
            Built in real classrooms, not a pitch deck.
          </h2>
          <p className="max-w-md text-base leading-relaxed text-ink-600 lg:col-span-5">
            We teach in schools and online with recognised partners. Our mentors are skilled
            practitioners we train and pay, and progress is measured by what learners build.
          </p>
        </div>

        <div className="mt-12 border-y border-slate-200 py-8">
          <PartnerStrip scroll showAll={false} />
        </div>

        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          {CLASSROOM_PHOTOS.map((photo) => (
            <figure key={photo.src}>
              <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.src}
                  alt={photo.alt}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
              </div>
              <figcaption className="mt-2.5 text-xs text-slate-500">{photo.caption}</figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-lg text-sm leading-relaxed text-slate-600">
            Every student we teach is a job for a skilled person who needed one.
          </p>
          <Link
            href="/partners"
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-ink-900 transition hover:text-brand-700"
          >
            School partnerships
            <ArrowForward fontSize="inherit" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
