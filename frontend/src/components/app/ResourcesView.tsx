"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGet } from "@/lib/api";
import type { ResourceRow } from "@/lib/app-types";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Input from "@/components/ui/Input";
import { buttonClass } from "@/components/ui/Button";

const PAGE = 24;

export default function ResourcesView() {
  const router = useRouter();
  const params = useSearchParams();
  const [resources, setResources] = useState<ResourceRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [q, setQ] = useState(params.get("q") ?? "");
  const [debouncedQ, setDebouncedQ] = useState(q);
  const [kind, setKind] = useState(params.get("kind") ?? "");
  const [course, setCourse] = useState(params.get("course") ?? "");
  const [visible, setVisible] = useState(PAGE);

  const load = useCallback(async () => {
    setError(null);
    try {
      const { resources } = await apiGet<{ resources: ResourceRow[] }>("/resources");
      setResources(resources);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the resource library.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [q]);

  // Sync filters into shareable URL params.
  useEffect(() => {
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (kind) next.set("kind", kind);
    if (course) next.set("course", course);
    const qs = next.toString();
    router.replace(qs ? `/dashboard/resources?${qs}` : "/dashboard/resources", { scroll: false });
  }, [q, kind, course, router]);

  useEffect(() => {
    setVisible(PAGE);
  }, [debouncedQ, kind, course]);

  const kinds = useMemo(
    () => [...new Set((resources ?? []).map((r) => r.kind).filter(Boolean))].sort(),
    [resources],
  );
  const courses = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of resources ?? []) if (r.course) m.set(r.course.id, r.course.title);
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [resources]);

  const filtered = useMemo(() => {
    return (resources ?? []).filter((r) => {
      if (kind && r.kind !== kind) return false;
      if (course && r.courseId !== course) return false;
      if (debouncedQ) {
        const hay = `${r.title} ${r.description ?? ""}`.toLowerCase();
        if (!hay.includes(debouncedQ)) return false;
      }
      return true;
    });
  }, [resources, kind, course, debouncedQ]);

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!resources) return <Spinner label="Loading resources…" />;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Resources</h1>
          <p className="mt-1 text-sm text-slate-500">
            Files and links shared for your courses, plus public library items.
          </p>
        </div>
        <Link href="/dashboard/resources/manage" className={buttonClass("secondary", "sm")}>
          Manage uploads
        </Link>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search resources…"
          aria-label="Search resources"
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Type
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {kinds.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Course
            <select
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All</option>
              {courses.map(([id, title]) => (
                <option key={id} value={id}>
                  {title}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {resources.length === 0 ? (
        <EmptyState
          title="No resources yet"
          description="Resources shared with you will appear here."
          action={
            <Link href="/dashboard/resources/manage" className={buttonClass("primary", "sm")}>
              Upload a resource
            </Link>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No matches"
          description="No resources match your search or filters."
          action={
            <button
              type="button"
              className={buttonClass("secondary", "sm")}
              onClick={() => {
                setQ("");
                setKind("");
                setCourse("");
              }}
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, visible).map((r) => (
              <li key={r.id}>
                <Link
                  href={`/dashboard/resources/${r.id}`}
                  className="flex h-full flex-col rounded-[20px] border border-slate-200 bg-white p-5 transition hover:border-brand-300"
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{r.kind}</span>
                  <span className="mt-1 font-display text-lg font-bold text-ink-900">{r.title}</span>
                  {r.description && <span className="mt-1 line-clamp-2 text-sm text-slate-600">{r.description}</span>}
                  <span className="mt-3 text-sm text-slate-500">
                    {r.course ? r.course.title : "General library"}
                    {!r.isPublished && <span className="text-amber-700"> · Draft</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {visible < filtered.length && (
            <div className="flex justify-center">
              <button type="button" className={buttonClass("secondary", "sm")} onClick={() => setVisible((v) => v + PAGE)}>
                Show more
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
