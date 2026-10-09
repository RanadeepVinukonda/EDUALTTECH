"use client";

import { useState } from "react";
import { apiGet, apiPatch, ApiError } from "@/lib/api";
import type { ContactMessageRow } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import { notifySuccess, notifyError } from "@/lib/notify";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { AdminHeader, FilterSelect, Pagination, Panel, Skeleton, useAsync } from "./admin-ui";

const FILTERS = [
  { value: "all", label: "All messages" },
  { value: "unread", label: "Unread" },
  { value: "handled", label: "Handled" },
];

export default function AdminInbox() {
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const messages = useAsync(
    () => apiGet<{ messages: ContactMessageRow[]; total: number; page: number; limit: number; hasMore: boolean }>("/contact", { filter, page, limit: 20 }),
    [filter, page],
  );

  async function update(m: ContactMessageRow, patch: { isRead?: boolean; handled?: boolean }) {
    setBusy(m.id);
    try {
      await apiPatch(`/contact/${m.id}`, patch);
      notifySuccess("Message updated");
      messages.reload();
    } catch (e) {
      notifyError(e instanceof ApiError ? e.message : "Could not update message");
    } finally {
      setBusy(null);
    }
  }

  const open = messages.data?.messages.find((m) => m.id === openId) ?? null;

  return (
    <div className="space-y-6">
      <AdminHeader title="Contact inbox" description="Messages submitted through the public contact form." />

      <Panel
        title="Messages"
        actions={
          <FilterSelect
            id="contact-filter"
            label="Show"
            value={filter}
            onChange={(v) => {
              setFilter(v);
              setPage(1);
            }}
            options={FILTERS}
          />
        }
      >
        {messages.error ? (
          <ErrorState message={messages.error} onRetry={messages.reload} />
        ) : messages.loading && !messages.data ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : messages.data && messages.data.messages.length > 0 ? (
          <div className="space-y-4">
            <ul className="divide-y divide-slate-100">
              {messages.data.messages.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => setOpenId(m.id)}
                    className="flex w-full items-start gap-3 py-3 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
                  >
                    <span
                      aria-hidden
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${m.isRead ? "bg-slate-200" : "bg-brand-600"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-ink-900">{m.name}</span>
                        <span className="text-xs text-slate-500">{m.email}</span>
                        {m.handledAt && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">handled</span>}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-slate-600">{m.subject || m.body}</span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-500">{formatDate(m.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <Pagination
              page={messages.data.page}
              total={messages.data.total}
              limit={messages.data.limit}
              hasMore={messages.data.hasMore}
              onChange={setPage}
              busy={messages.loading}
            />
          </div>
        ) : (
          <EmptyState
            title={filter === "all" ? "Inbox is empty" : "No messages match this filter"}
            description="New contact submissions will appear here."
          />
        )}
      </Panel>

      {open && (
        <Detail
          message={open}
          busy={busy === open.id}
          onClose={() => setOpenId(null)}
          onToggleRead={() => update(open, { isRead: !open.isRead })}
          onToggleHandled={() => update(open, { handled: !open.handledAt })}
        />
      )}
    </div>
  );
}

function Detail({
  message: m,
  busy,
  onClose,
  onToggleRead,
  onToggleHandled,
}: {
  message: ContactMessageRow;
  busy: boolean;
  onClose: () => void;
  onToggleRead: () => void;
  onToggleHandled: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/40 p-4" role="presentation" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="msg-title"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-[20px] border border-slate-200 bg-white shadow-elev3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <h2 id="msg-title" className="font-display text-lg font-bold text-ink-900">
              {m.subject || "Contact message"}
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              {m.name} · {m.email}
              {m.phone ? ` · ${m.phone}` : ""}
            </p>
            <p className="text-xs text-slate-400">{formatDate(m.createdAt)}</p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto whitespace-pre-wrap p-5 text-[15px] leading-relaxed text-ink-900">{m.body}</div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 p-5">
          <a
            href={`mailto:${encodeURIComponent(m.email)}?subject=${encodeURIComponent(`Re: ${m.subject || "your message"}`)}`}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-slate-50"
          >
            Email sender
          </a>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={onToggleRead}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-ink-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Mark {m.isRead ? "unread" : "read"}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={onToggleHandled}
              className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {m.handledAt ? "Reopen" : "Mark handled"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
