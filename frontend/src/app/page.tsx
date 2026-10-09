"use client";

import { useEffect, useState } from "react";
import { apiGet, ApiError } from "@/lib/api";
import { TEAM, teamImage } from "@/data/team";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";

interface Course {
  id: string;
  title: string;
  slug: string;
}

export default function Home() {
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setCourses(null);
    setError(null);
    apiGet<{ items: Course[] }>("/courses", { auth: false })
      .then((res) => alive && setCourses(res.items))
      .catch((e) => alive && setError(e instanceof ApiError ? e.message : "Failed to load courses"));
    return () => {
      alive = false;
    };
  }, [tick]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-display text-4xl font-bold text-ink-700 sm:text-5xl">
        Learn. Build. Grow.
      </h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Courses, mentors, and roadmaps for ambitious learners — a product by Setsuzoku.
      </p>

      <section className="mt-12">
        <h2 className="font-display text-3xl font-bold text-ink-700">Courses</h2>
        <div className="mt-6">
          {!courses && !error && <Spinner label="Loading courses…" />}
          {error && <ErrorState message={error} onRetry={() => setTick((t) => t + 1)} />}
          {courses && courses.length === 0 && (
            <EmptyState title="No courses yet" description="Published courses will appear here." />
          )}
          {courses && courses.length > 0 && (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((c) => (
                <li key={c.id} className="rounded-[20px] bg-white p-6 shadow-elev2">
                  <p className="font-display text-lg font-bold text-ink-700">{c.title}</p>
                  <p className="mt-1 font-mono text-xs text-slate-400">{c.slug}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-3xl font-bold text-ink-700">Our team</h2>
        <div className="mt-6 grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-5">
          {TEAM.map((m) => (
            <div key={m.image} className="flex flex-col items-center text-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={teamImage(m.image)}
                alt={m.name}
                loading="lazy"
                decoding="async"
                className="h-24 w-24 rounded-full object-cover ring-2 ring-brand-100"
              />
              <p className="mt-3 font-display text-sm font-bold text-ink-700">{m.name}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
