"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiDelete, apiGet } from "@/lib/api";
import type { WishlistItem } from "@/lib/app-types";
import { notifyError, notifySuccess } from "@/lib/notify";
import { buttonClass } from "@/components/ui/Button";
import IconActionButton from "@/components/ui/IconActionButton";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import CourseCard from "@/components/landing/CourseCard";

export default function WishlistView() {
  const [items, setItems] = useState<WishlistItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setError(null);
    try {
      const { items: rows } = await apiGet<{ items: WishlistItem[] }>("/wishlist");
      setItems(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load your wishlist.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function remove(courseId: string) {
    if (pending.has(courseId)) return;
    setPending((p) => new Set(p).add(courseId));
    try {
      await apiDelete(`/wishlist/${courseId}`);
      await load(); // authoritative refresh — reconciles stale/deleted items
      notifySuccess("Removed from your wishlist.");
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Could not remove this course.");
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(courseId);
        return n;
      });
    }
  }

  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!items) return <Spinner label="Loading your wishlist…" />;

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-3xl font-bold text-ink-900">Wishlist</h1>
        <EmptyState
          title="Your wishlist is empty"
          description="Save courses you're interested in and find them here later."
          action={
            <Link href="/courses" className={buttonClass("primary", "sm")}>
              Browse courses
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold text-ink-900">Wishlist</h1>
        <p className="mt-1 text-[15px] text-slate-500">Saved courses. Saving does not enroll you — that happens at checkout.</p>
      </header>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const available = item.course.status === "PUBLISHED";
          const busy = pending.has(item.courseId);
          return (
            <li key={item.id}>
              <CourseCard
                course={item.course}
                unavailable={!available}
                viewLabel="View"
                actions={
                  <IconActionButton
                    icon="delete"
                    label={busy ? "Removing" : "Remove"}
                    onClick={() => void remove(item.courseId)}
                    disabled={busy}
                    aria-label={`Remove ${item.course.title} from wishlist`}
                  />
                }
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
