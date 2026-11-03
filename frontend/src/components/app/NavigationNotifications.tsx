"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import NotificationsIcon from "@mui/icons-material/Notifications";
import FilterList from "@mui/icons-material/FilterList";
import { usePathname } from "next/navigation";
import { apiGet, apiPost, NOTIFICATIONS_CHANGED_EVENT, signalNotificationsChanged } from "@/lib/api";
import type { NotificationItem } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";
import Spinner from "@/components/ui/Spinner";

type NotificationFilter = "all" | "unread";

export default function NavigationNotifications() {
  const pathname = usePathname();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<NotificationFilter>("all");
  const [items, setItems] = useState<NotificationItem[] | null>(null);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<{ notifications: NotificationItem[]; unread: number }>("/notifications", { limit: 6 });
      setItems(data.notifications);
      setUnread(data.unread);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, load);
  }, [load]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function markRead(notification: NotificationItem) {
    if (notification.readAt || busy) return;
    setBusy(true);
    try {
      await apiPost("/notifications/read", { ids: [notification.id] });
      setItems((current) =>
        current?.map((item) =>
          item.id === notification.id ? { ...item, readAt: new Date().toISOString() } : item,
        ) ?? current,
      );
      setUnread((count) => Math.max(0, count - 1));
      signalNotificationsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update this notification.");
    } finally {
      setBusy(false);
    }
  }

  async function markAllRead() {
    if (busy) return;
    setBusy(true);
    try {
      await apiPost("/notifications/read", {});
      setItems((current) =>
        current?.map((item) => item.readAt ? item : { ...item, readAt: new Date().toISOString() }) ?? current,
      );
      setUnread(0);
      signalNotificationsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not mark notifications as read.");
    } finally {
      setBusy(false);
    }
  }

  const filteredItems = (items ?? []).filter((item) => selected === "all" || !item.readAt);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);
          if (nextOpen) void load();
        }}
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls="workspace-notifications"
        className="relative grid h-11 w-11 place-items-center rounded-full text-ink-2 transition-colors hover:bg-paper-2 hover:text-ink active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <NotificationsIcon fontSize="small" aria-hidden />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-semibold leading-none text-accent-ink">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <section
          id="workspace-notifications"
          role="dialog"
          aria-labelledby="workspace-notifications-title"
          className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-lg border border-rule bg-paper shadow-elev3"
        >
          <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-3">
            <h2 id="workspace-notifications-title" className="flex items-center gap-2 text-sm font-semibold text-ink">
              <FilterList fontSize="small" aria-hidden />
              Notifications
            </h2>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  disabled={busy}
                  className="min-h-11 whitespace-nowrap rounded-md px-2 text-xs font-medium text-ink-2 hover:bg-paper-2 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-55"
                >
                  Mark all read
                </button>
              )}
              <Link
                href="/dashboard/notifications"
                onClick={() => setOpen(false)}
                className="min-h-11 whitespace-nowrap rounded-md px-2 py-3 text-sm font-medium text-accent hover:bg-paper-2 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                View all
              </Link>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto border-b border-rule px-4 py-2" role="group" aria-label="Notification filter">
            {(["all", "unread"] as NotificationFilter[]).map((filter) => (
              <button
                key={filter}
                type="button"
                aria-pressed={selected === filter}
                onClick={() => setSelected(filter)}
                className={cn(
                  "min-h-11 rounded-md px-3 text-sm font-medium capitalize transition-colors active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                  selected === filter ? "bg-paper-2 text-accent" : "text-ink-2 hover:bg-paper-2",
                )}
              >
                {filter}
              </button>
            ))}
          </div>

          {error ? (
            <div className="p-4" role="alert">
              <p className="text-sm text-ink-2">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-2 min-h-11 rounded-md px-2 text-sm font-semibold text-accent hover:bg-paper-2 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Try again
              </button>
            </div>
          ) : loading && !items ? (
            <div className="p-5">
              <Spinner label="Loading notifications…" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted">
              {selected === "unread" ? "No unread notifications." : "No notifications yet."}
            </div>
          ) : (
            <ul className="max-h-80 divide-y divide-rule overflow-y-auto">
              {filteredItems.map((item) => (
                <li key={item.id} className={cn("p-4 transition-colors hover:bg-paper-2/70", !item.readAt && "bg-paper-2/40")}>
                  <div className="mb-1 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <NotificationsIcon fontSize="small" aria-hidden className="shrink-0 text-accent" />
                      {item.course ? (
                        <Link
                          href={`/dashboard/courses/${item.course.slug}`}
                          onClick={() => {
                            void markRead(item);
                            setOpen(false);
                          }}
                          className="truncate text-sm font-medium text-ink hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        >
                          {item.title}
                        </Link>
                      ) : (
                        <span className="truncate text-sm font-medium text-ink">{item.title}</span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted">{formatDate(item.createdAt)}</span>
                  </div>
                  <div className="flex items-end justify-between gap-3">
                    <p className="line-clamp-2 text-sm leading-relaxed text-ink-2">{item.body}</p>
                    {!item.readAt && (
                      <button
                        type="button"
                        onClick={() => void markRead(item)}
                        disabled={busy}
                        aria-label={`Mark ${item.title} as read`}
                        title="Mark as read"
                        className="min-h-11 min-w-11 shrink-0 rounded-md px-2 text-xs font-medium text-accent hover:bg-paper-3 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-not-allowed disabled:opacity-55"
                      >
                        Read
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
          {loading && items && (
            <p className="border-t border-rule px-4 py-2 text-xs text-muted" role="status">
              Refreshing notifications…
            </p>
          )}
        </section>
      )}
    </div>
  );
}
