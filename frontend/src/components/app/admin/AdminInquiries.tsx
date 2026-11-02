"use client";

import { useState } from "react";
import MailOutline from "@mui/icons-material/EmailOutlined";
import MarkEmailRead from "@mui/icons-material/MarkEmailRead";
import { apiPatch, apiGet } from "@/lib/api";
import type { ContactMessageRow } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import { notifyError, notifySuccess } from "@/lib/notify";
import Button from "@/components/ui/Button";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { AdminHeader, FilterSelect, Pagination, Panel, Skeleton, StatusPill, useAsync } from "./admin-ui";

type Filter = "all" | "unread" | "handled";
type Response = { messages: ContactMessageRow[]; total: number; page: number; limit: number; hasMore: boolean };

const FILTERS = [
  { value: "all", label: "All messages" },
  { value: "unread", label: "Unread" },
  { value: "handled", label: "Handled" },
];

export default function AdminInquiries() {
  const [filter, setFilter] = useState<Filter>("unread");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const inbox = useAsync(
    () => apiGet<Response>("/contact", { filter, page, limit: 20 }),
    [filter, page],
  );

  async function update(id: string, patch: { isRead?: boolean; handled?: boolean }) {
    setBusyId(id);
    try {
      await apiPatch(`/contact/${id}`, patch);
      notifySuccess(patch.handled === false ? "Message reopened." : "Message updated.");
      inbox.reload();
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Could not update the message.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Tuition & contact inquiries"
        description="Messages from learners, guardians, and educators, including tuition requests and offers."
      />

      <Panel
        title="Inbox"
        description="Mark a message read, or mark it handled once someone has replied."
        actions={
          <FilterSelect
            id="inquiry-filter"
            label="Filter"
            value={filter}
            onChange={(v) => {
              setFilter(v as Filter);
              setPage(1);
            }}
            options={FILTERS}
            icon={<MailOutline fontSize="inherit" />}
          />
        }
      >
        {inbox.error ? (
          <ErrorState message={inbox.error} onRetry={inbox.reload} />
        ) : inbox.loading && !inbox.data ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : inbox.data && inbox.data.messages.length > 0 ? (
          <div className="space-y-4">
            <ul className="space-y-3">
              {inbox.data.messages.map((message) => (
                <li key={message.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-ink-900">{message.name}</p>
                      <p className="text-xs text-slate-500">
                        <a href={`mailto:${message.email}`} className="hover:text-ink-900">{message.email}</a>
                        {message.phone ? ` · ${message.phone}` : ""}
                        {` · ${formatDate(message.createdAt)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill tone={message.handledAt ? "success" : message.isRead ? "warn" : "danger"}>
                        {message.handledAt ? "Handled" : message.isRead ? "Read" : "Unread"}
                      </StatusPill>
                    </div>
                  </div>
                  {message.subject && <p className="mt-3 text-sm font-medium text-ink-800">{message.subject}</p>}
                  <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{message.body}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!message.isRead && (
                      <Button variant="secondary" size="sm" loading={busyId === message.id} onClick={() => update(message.id, { isRead: true })}>
                        Mark read
                      </Button>
                    )}
                    <Button
                      variant={message.handledAt ? "outline" : "primary"}
                      size="sm"
                      loading={busyId === message.id}
                      onClick={() => update(message.id, { handled: !message.handledAt })}
                    >
                      <MarkEmailRead fontSize="small" />
                      {message.handledAt ? "Reopen" : "Mark handled"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination
              page={inbox.data.page}
              total={inbox.data.total}
              limit={inbox.data.limit}
              hasMore={inbox.data.hasMore}
              onChange={setPage}
              busy={inbox.loading}
            />
          </div>
        ) : (
          <EmptyState
            title={filter === "unread" ? "No unread messages" : "No messages found"}
            description="New messages from the contact form and tuition enquiries appear here."
          />
        )}
      </Panel>
    </div>
  );
}
