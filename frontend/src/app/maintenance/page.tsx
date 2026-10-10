import type { Metadata } from "next";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Under maintenance",
  description: "Under maintenance. We'll be back shortly.",
  robots: { index: false },
};

export default function MaintenancePage() {
  return (
    <section className="maint-dots flex min-h-dvh flex-col items-center justify-center bg-ink-700 px-4 text-center text-white">
      <div className="maint-mark" aria-hidden="true">
        <span className="m-ring m-ring-1" />
        <span className="m-ring m-ring-2" />
        <span className="m-ring m-ring-3" />
        <span className="m-core" />
      </div>

      <h1 className="mt-12 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
        Under maintenance
      </h1>

      <div className="maint-bar mt-8" aria-hidden="true">
        <span className="maint-bar-inner" />
      </div>

      <p className="mt-8 text-lg text-ink-100">Be back shortly.</p>

      <footer className="mt-16 text-xs uppercase tracking-[0.25em] text-ink-300">EduAltTech</footer>
    </section>
  );
}