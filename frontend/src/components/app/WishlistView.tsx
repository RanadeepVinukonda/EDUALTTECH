"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiDelete, apiGet } from "@/lib/api";
import type { WishlistItem } from "@/lib/app-types";
import { formatPrice } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/notify";
import { buttonClass } from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import CoverImage from "@/components/ui/CoverImage";

function excerpt(text: string, max = 140) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
}

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

      <ul className="space-y-4">
        {items.map((item) => {
          const available = item.course.status === "PUBLISHED";
          const busy = pending.has(item.courseId);
          return (
            <li key={item.id} className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-elev1">
              <div className="flex flex-wrap items-start gap-4">
                <CoverImage src={item.course.thumbnailUrl} alt="" fallback={item.course.title} className="h-20 w-28 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <h2 className="font-display font-bold text-ink-900">{item.course.title}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">{item.course.category}</p>
                  <p className="mt-2 text-sm text-slate-600">{excerpt(item.course.description)}</p>
                  <p className="mt-2 font-display font-bold text-ink-900">{formatPrice(item.course.pricePaise, item.course.currency)}</p>
                </div>
                <div className="flex flex-col items-stretch gap-2">
                  {available ? (
                    <Link href={`/courses/${item.course.slug}`} className={buttonClass("primary", "sm")}>
                      View course
                    </Link>
                  ) : (
                    <span className="rounded-xl bg-slate-100 px-4 py-2 text-center text-sm font-semibold text-slate-500">
                      No longer available
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => void remove(item.courseId)}
                    disabled={busy}
                    aria-label={`Remove ${item.course.title} from wishlist`}
                    className={buttonClass("secondary", "sm")}
                  >
                    {busy ? "Removing…" : "Remove"}
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
