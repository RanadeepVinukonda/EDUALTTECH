const PHOTOS = [
  { src: "/media/photos/EAT2.jpg", alt: "A teaching session at EduAltTech" },
  { src: "/media/photos/EAT3.jpg", alt: "A mentor working with learners at EduAltTech" },
  { src: "/media/photos/EAT4.jpg", alt: "A learner at work during an EduAltTech session" },
];

/**
 * Full-width photo band. All three on-site photographs shown large, with a
 * short statement strip beneath so the row reads as a story, not a stock grid.
 */
export default function PhotoBand() {
  return (
    <section className="bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
            Real rooms, real mentors, real students
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-ink-600">
            Sessions run face to face and online, led by practitioners sharing the skills they have developed.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-6">
          {PHOTOS.map((p) => (
            <div key={p.src} className="overflow-hidden rounded-2xl border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.src}
                alt={p.alt}
                loading="lazy"
                className="h-64 w-full object-cover sm:h-96"
              />
            </div>
          ))}
        </div>

        <p className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-700">
          <span className="h-px w-6 bg-brand-600" aria-hidden />
          Mentors can share their skills and earn through teaching.
        </p>
      </div>
    </section>
  );
}
