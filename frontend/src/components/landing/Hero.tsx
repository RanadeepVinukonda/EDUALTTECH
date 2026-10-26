import LinkButton from "@/components/ui/LinkButton";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-24 lg:px-8">
        <div>
          <p className="inline-flex items-center rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">
            Education beyond the syllabus
          </p>
          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-ink-900 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
            Edu Alt Tech — an education company that also puts skilled people to work
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600">
            EduAltTech teaches students through structured courses, alternate learning, and tuition —
            and employs skilled people who were out of work as the mentors who teach them. One platform,
            opportunity on both sides.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/courses" size="lg">
              Explore courses
            </LinkButton>
            <LinkButton href="/mentor" variant="secondary" size="lg">
              Teach with us
            </LinkButton>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-elev2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media/photos/EAT3.jpg"
              alt="An EduAltTech learning session"
              fetchPriority="high"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
