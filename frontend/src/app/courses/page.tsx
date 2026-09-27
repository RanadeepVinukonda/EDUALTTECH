"use client";

import { useCallback, useEffect, useState } from "react";
import { api, getCachedUser } from "@/lib/api";
import { Loader } from "@/components/Loader";
import { useMinLoading } from "@/lib/useMinLoading";
import { CourseCard, type CourseCardData } from "@/components/courses/CourseCard";

interface CourseItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string | null;
  pricePaise: number | null;
  thumbnailUrl: string | null;
  teacher: { name: string };
  _count: { enrollments: number; modules: number };
}

export default function CoursesPage() {
  const [items, setItems] = useState<CourseItem[]>([]);
  const [search, setSearch] = useState("");
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const minLoading = useMinLoading(!loading);
  const showLoader = loading || minLoading;

  const loadBookmarks = useCallback(() => {
    if (!getCachedUser()) return;
    api<{ items: Array<{ id: string }> }>("/wishlist")
      .then((d) => setBookmarks(new Set(d.items.map((i) => i.id))))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api<{ items: CourseItem[] }>(`/courses?search=${encodeURIComponent(search)}`)
        .then((d) => setItems(d.items))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function toggleBookmark(course: CourseCardData | CourseItem) {
    if (!getCachedUser()) {
      window.location.href = "/login";
      return;
    }
    const saved = bookmarks.has(course.id);
    await api(`/wishlist/${course.id}`, { method: saved ? "DELETE" : "POST" }).catch(() => undefined);
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (saved) next.delete(course.id);
      else next.add(course.id);
      return next;
    });
  }

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

      {showLoader ? (
        <Loader />
      ) : items.length === 0 ? (
        <p className="mt-10 rounded-xl border border-dashed border-slate-300 p-10 text-center text-slate-500">
          No courses found yet — check back soon.
        </p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => (
            <CourseCard
              key={c.id}
              course={c as unknown as CourseCardData}
              saved={bookmarks.has(c.id)}
              onToggleBookmark={toggleBookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
}
