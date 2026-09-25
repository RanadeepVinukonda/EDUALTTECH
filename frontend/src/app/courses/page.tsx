"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface CourseItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string | null;
  thumbnailUrl: string | null;
  teacher: { name: string };
  _count: { enrollments: number; modules: number };
}

export default function CoursesPage() {
  const [items, setItems] = useState<CourseItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api<{ items: CourseItem[] }>(`/courses?search=${encodeURIComponent(search)}`)
        .then((d) => setItems(d.items))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-slate-900">Courses & digital classrooms</h1>
      <p className="mt-1 text-slate-600">Structured learning built with teachers, tested with students.</p>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search courses…"
        className="mt-6 w-full max-w-md rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
      />

      {loading ? (
        <p className="mt-10 text-slate-500">Loading courses…</p>
      ) : items.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          No courses found yet — check back soon.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <Link
              key={c.id}
              href={`/courses/${c.slug}`}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-brand-300 hover:shadow-sm"
            >
              {c.thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.thumbnailUrl} alt="" className="h-40 w-full object-cover" />
              ) : (
                <div className="flex h-40 items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100">
                  <span className="rounded-xl brand-grad px-3 py-1.5 text-sm font-bold text-white">{c.subject[0]}</span>
                </div>
              )}
              <div className="p-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">{c.subject}</p>
              <h2 className="font-display mt-2 text-lg font-semibold text-slate-900 group-hover:text-brand-800">{c.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-slate-600">{c.description}</p>
              <p className="mt-4 text-xs text-slate-500">
                {c.teacher.name} · {c._count.modules} modules · {c._count.enrollments} enrolled
              </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
