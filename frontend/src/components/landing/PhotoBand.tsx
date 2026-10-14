import Link from "next/link";

/**
 * Editorial photo band. Left column carries the message; right column is an
 * offset image grid using the on-site photographs. The last tile is a
 * statement block so the grid never reads as a generic photo wall.
 */
export default function PhotoBand() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-4 lg:self-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Inside our classrooms</p>
            <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-ink-900 sm:text-4xl">
              Real rooms, real mentors, real students
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-ink-600">
              Sessions run face to face and online, led by mentors who came to us as skilled people looking
              for work. The students in front of them are why it matters.
            </p>
            <Link
              href="/about"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              How we work
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:col-span-8 sm:gap-5">
            <div className="col-span-2 overflow-hidden rounded-2xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/media/photos/EAT2.jpg"
                alt="A teaching session at EduAltTech"
                loading="lazy"
                className="h-56 w-full object-cover sm:h-80"
              />
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/media/photos/EAT4.jpg"
                alt="A learner at work during an EduAltTech session"
                loading="lazy"
                className="h-40 w-full object-cover sm:h-52"
              />
            </div>
            <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-ink-900 p-6">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-400">Two-sided by design</p>
              <p className="mt-4 font-display text-xl font-bold leading-snug text-white">
                Every student we teach is a job for a skilled person who needed one.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
