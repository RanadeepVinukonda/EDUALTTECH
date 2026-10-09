"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiGet, apiPost } from "@/lib/api";
import type { NotificationItem } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/notify";
import { cn } from "@/lib/cn";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/Button";

type Filter = "all" | "unread";
const LIMIT = 20;

export default function NotificationsView() {
  const [filter, setFilter] = useState<Filter>("all");
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (targetPage: number, replace: boolean) => {
      if (replace) setError(null);
      else setLoadingMore(true);
      try {
        const data = await apiGet<{
          notifications: NotificationItem[];
          unread: number;
          hasMore: boolean;
        }>("/notifications", { page: targetPage, limit: LIMIT, unreadOnly: filter === "unread" ? true : undefined });
        setUnread(data.unread);
        setHasMore(data.hasMore);
        setPage(targetPage);
        setItems((prev) => (replace || !prev ? data.notifications : [...prev, ...data.notifications]));
      } catch (e) {
        if (replace) setError(e instanceof Error ? e.message : "Could not load notifications.");
        else notifyError(e instanceof Error ? e.message : "Could not load more notifications.");
      } finally {
        setLoadingMore(false);
      }
    },
    [filter],
  );

  useEffect(() => {
    void load(1, true);
  }, [load]);

  useEffect(() => {
    function onFocus() {
      void load(1, true);
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [load]);

  async function markAll() {
    if (busy) return;
    setBusy(true);
    try {
      await apiPost("/notifications/read", {});
      notifySuccess("All notifications marked read.");
      await load(1, true);
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "Could not mark notifications read.");
    } finally {
      setBusy(false);
    }
  }

  async function markOne(n: NotificationItem) {
    if (busy || n.readAt) return;
    setBusy(true);
    try {
      await apiPost("/notifications/read", { ids: [n.id] });
      setItems((prev) => prev?.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x)) ?? prev);
      setUnread((u) => Math.max(0, u - 1));
    } catch (e) {
      notifyError(e instanceof Error ? e.message : "Could not update the notification.");
      await load(1, true);
    } finally {
      setBusy(false);
    }
  }

  if (error) return <ErrorState message={error} onRetry={() => void load(1, true)} />;
  if (!items) return <Spinner label="Loading notifications…" />;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unread > 0 ? `${unread} unread` : "You're all caught up."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div role="tablist" aria-label="Notification filter" className="flex gap-1">
            {(["all", "unread"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                onClick={() => setFilter(f)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-semibold capitalize",
                  filter === f ? "bg-brand-600 text-white" : "bg-slate-100 text-ink-700",
                )}
              >
                {f}
              </button>
            ))}
          </div>
          {unread > 0 && (
            <button type="button" className={buttonClass("secondary", "sm")} onClick={() => void markAll()} disabled={busy}>
              Mark all read
            </button>
          )}
        </div>
      </header>

      {items.length === 0 ? (
        <EmptyState
          title={filter === "unread" ? "No unread notifications" : "No notifications"}
          description="Updates about your courses, applications, and meetings appear here."
        />
      ) : (
        <>
          <ul className="flex flex-col divide-y divide-slate-200 rounded-[20px] border border-slate-200 bg-white">
            {items.map((n) => {
              const unreadItem = !n.readAt;
              const body = (
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold text-ink-900">
                    {n.title}
                    {unreadItem && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[11px] font-bold text-brand-700">
                        Unread
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(n.createdAt)}</p>
                </div>
              );
              return (
                <li key={n.id} className={cn("p-4 sm:p-5", unreadItem && "bg-brand-50/40")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    {n.course ? (
                      <Link
                        href={`/dashboard/courses/${n.course.slug}`}
                        onClick={() => void markOne(n)}
                        className="min-w-0 flex-1"
                      >
                        {body}
                      </Link>
                    ) : (
                      <div className="min-w-0 flex-1">{body}</div>
                    )}
                    {unreadItem && (
                      <button type="button" className={buttonClass("ghost", "sm")} onClick={() => void markOne(n)} disabled={busy}>
                        Mark read
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          {hasMore && (
            <div className="flex justify-center">
              <button
                type="button"
                className={buttonClass("secondary", "sm")}
                disabled={loadingMore}
                onClick={() => void load(page + 1, false)}
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
