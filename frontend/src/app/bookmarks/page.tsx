"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Loader } from "@/components/Loader";
import { useMinLoading } from "@/lib/useMinLoading";
import { Bookmark as BookmarkIcon, BookmarkX } from "lucide-react";

interface SavedCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  subject: string;
  teacher: { name: string };
  _count: { enrollments: number; modules: number };
  savedAt: string;
}

interface SavedResource {
  id: string;
  title: string;
  subject: string;
  kind: string;
  fileUrl: string;
  savedAt: string;
}

export default function BookmarksPage() {
  const [courses, setCourses] = useState<SavedCourse[] | null>(null);
  const [resources, setResources] = useState<SavedResource[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loading = useMinLoading(courses !== null && resources !== null);

  useEffect(() => {
    api<{ items: SavedCourse[] }>("/wishlist")
      .then((d) => setCourses(d.items))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load bookmarks"));
    api<{ items: SavedResource[] }>("/resources/bookmarks")
      .then((d) => setResources(d.items))
      .catch(() => setResources([]));
  }, []);

  async function removeCourse(id: string) {
    await api(`/wishlist/${id}`, { method: "DELETE" }).catch(() => undefined);
    setCourses((prev) => prev?.filter((c) => c.id !== id) ?? null);
  }

  async function removeResource(id: string) {
    await api(`/resources/${id}/bookmark`, { method: "DELETE" }).catch(() => undefined);
    setResources((prev) => prev?.filter((r) => r.id !== id) ?? null);
  }

  if (error) return <div className="mx-auto max-w-7xl px-4 py-16 text-red-600">{error}</div>;
  if (!courses || !resources || loading) return <Loader />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-slate-900">Bookmarks</h1>
      <p className="mt-1 text-slate-600">Courses and resources you saved with the bookmark icon.</p>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-slate-900">Courses</h2>
        {courses.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center">
            <p className="text-slate-500">No courses bookmarked yet.</p>
            <Link href="/courses" className="mt-3 inline-block font-semibold text-brand-700 hover:text-brand-800">
              Browse courses →
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((c) => (
              <article
                key={c.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-brand-300 hover:shadow-sm"
              >
                <Link href={`/courses/${c.slug}`} className="block">
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
                      {c.teacher.name} · {c._count.modules} modules · {c._count.enrollments} enrolled · saved{" "}
                      {new Date(c.savedAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3">
                  <Link href={`/courses/${c.slug}`} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                    Enroll →
                  </Link>
                  <button
                    onClick={() => removeCourse(c.id)}
                    className="flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-600"
                  >
                    <BookmarkX className="h-4 w-4" /> Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold text-slate-900">Resources</h2>
        {resources.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500">
            No resources bookmarked yet.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {resources.map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-5 py-4">
                <BookmarkIcon className="h-4 w-4 shrink-0 text-brand-600" />
                <a
                  href={r.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800 hover:text-brand-700"
                >
                  {r.title}
                </a>
                <span className="shrink-0 text-xs text-slate-400">
                  {r.subject} · {r.kind}
                </span>
                <button
                  onClick={() => removeResource(r.id)}
                  className="shrink-0 text-xs font-medium text-slate-400 hover:text-red-600"
                  aria-label={`Remove ${r.title} from bookmarks`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}