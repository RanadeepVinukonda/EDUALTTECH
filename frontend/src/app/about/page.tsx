import Link from "next/link";

export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h1 className="font-display text-4xl font-bold text-slate-900">Built with schools, not just sold to them</h1>
      <p className="mt-6 text-lg text-slate-600">
        Edu-Alt-Tech is an ed-tech platform that builds digital classrooms, learning apps and
        school tools together with real partner schools. Students learn on it, teachers teach on
        it, and schools run on it.
      </p>
      <p className="mt-4 text-lg text-slate-600">
        Technology for schools that students actually use — developed <strong>with</strong> the
        schools. Real problems, real campuses, real results. Every tool is tested with the people
        who use it daily before it ships.
      </p>

      <h2 className="font-display mt-12 text-2xl font-bold text-slate-900">What we offer schools</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[
          ["Digital Classrooms", "Lessons, assignments, progress tracking teachers can run from day one."],
          ["School Administration", "Admissions, records, timetables — out of paper registers into one system."],
          ["Parent Communication", "Notices and reports that reach every parent, in the language they speak."],
          ["Learning Analytics", "See which lessons work and which students need help before the term ends."],
        ].map(([title, body]) => (
          <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <p className="mt-1 text-sm text-slate-600">{body}</p>
          </div>
        ))}
      </div>

      <h2 className="font-display mt-12 text-2xl font-bold text-slate-900">Impact so far</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          ["11+", "Partner schools"],
          ["1000+", "Students reached"],
          ["100+", "Study resources"],
          ["98%", "Satisfaction rate"],
        ].map(([v, l]) => (
          <div key={l} className="rounded-2xl bg-brand-50 p-6 text-center">
            <p className="font-display text-3xl font-bold text-brand-800">{v}</p>
            <p className="mt-1 text-sm text-slate-600">{l}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-3xl bg-brand-700 p-10 text-center">
        <h2 className="font-display text-2xl font-bold text-white">Want your school on the list?</h2>
        <Link href="/contact" className="mt-6 inline-block rounded-xl bg-white px-6 py-3 font-semibold text-brand-800 hover:bg-brand-50">
          Contact the team
        </Link>
      </div>
    </div>
  );
}
