import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Under Construction · Edu-Alt-Tech",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center">
      <p className="text-sm font-semibold tracking-widest text-sky-400 uppercase">Edu-Alt-Tech</p>
      <h1 className="mt-4 max-w-2xl font-display text-4xl font-bold text-white sm:text-5xl">
        Website under construction.
      </h1>
      <p className="mt-4 max-w-xl text-slate-400">
        We're building something big — technology for schools, built with schools.
        Check back soon.
      </p>
      <a
        href="mailto:info@edualttech.com"
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-400"
      >
        Contact us
      </a>
    </main>
  );
}