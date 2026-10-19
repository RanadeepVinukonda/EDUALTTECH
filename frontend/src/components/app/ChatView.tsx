"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";
import { useAuth } from "./AuthProvider";
import type { ChatMessage, ChatPeer, Conversation } from "@/lib/app-types";
import { formatDate } from "@/lib/format";
import { initials } from "@/lib/name";
import { cn } from "@/lib/cn";
import Send from "@mui/icons-material/Send";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import Button, { buttonClass } from "@/components/ui/Button";

function peerOf(c: Conversation, meId: string) {
  return c.learnerUserId === meId ? c.mentor : c.learner;
}

export default function ChatView({ courseId, title, compact = false, roster }: { courseId?: string; title?: string; compact?: boolean; roster?: ChatPeer[] } = {}) {
  const { user } = useAuth();
  const [convs, setConvs] = useState<Conversation[] | null>(null);
  const [convError, setConvError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rosterBusy, setRosterBusy] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [threadLoading, setThreadLoading] = useState(false);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const sendingRef = useRef(false);

  const loadConversations = useCallback(async () => {
    setConvError(null);
    try {
      const { conversations } = await apiGet<{ conversations: Conversation[] }>("/chat/conversations");
      setConvs(conversations);
      return conversations;
    } catch (e) {
      setConvError(e instanceof Error ? e.message : "Could not load conversations.");
      return null;
    }
  }, []);

  const loadThread = useCallback(async (id: string, older?: string) => {
    if (older) setLoadingOlder(true);
    else {
      setThreadLoading(true);
      setMessages([]);
    }
    setThreadError(null);
    try {
      const { messages: page, hasMore: more } = await apiGet<{ messages: ChatMessage[]; hasMore: boolean }>(
        `/chat/conversations/${id}/messages`,
        older ? { cursor: older, limit: 50 } : { limit: 50 },
      );
      const asc = [...page].reverse();
      setMessages((prev) => (older ? [...asc, ...prev] : asc));
      setHasMore(more);
    } catch (e) {
      setThreadError(e instanceof Error ? e.message : "Could not load messages.");
    } finally {
      setThreadLoading(false);
      setLoadingOlder(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  // Optionally scope the thread list to a single course.
  const visible = useMemo(
    () => (convs ? (courseId ? convs.filter((c) => c.courseId === courseId) : convs) : null),
    [convs, courseId],
  );

  useEffect(() => {
    if (!visible) return;
    setSelectedId((cur) => (cur && visible.some((c) => c.id === cur) ? cur : visible[0]?.id ?? null));
  }, [visible]);

  useEffect(() => {
    if (selectedId) void loadThread(selectedId);
  }, [selectedId, loadThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, selectedId]);

  // Refresh unread counts + open thread when the window regains focus (no polling).
  useEffect(() => {
    function onFocus() {
      void loadConversations();
      if (selectedId) void loadThread(selectedId);
    }
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [loadConversations, loadThread, selectedId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!selectedId || !text || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    try {
      const { message } = await apiPost<{ message: ChatMessage }>(`/chat/conversations/${selectedId}/messages`, { body: text });
      setMessages((prev) => [...prev, message]);
      setDraft("");
      void loadConversations();
    } catch {
      // Preserve the draft so the user can retry.
      setThreadError("Message not sent. Your text was kept - try again.");
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }

  // Mentor side: jump into a learner's thread, creating it on first contact.
  async function openWith(peer: ChatPeer) {
    if (rosterBusy) return;
    const existing = visible?.find((c) => c.learnerUserId === peer.id);
    if (existing) {
      setSelectedId(existing.id);
      return;
    }
    if (!courseId) return;
    setRosterBusy(peer.id);
    try {
      const { conversation } = await apiPost<{ conversation: Conversation }>("/chat/conversations", {
        courseId,
        learnerUserId: peer.id,
      });
      await loadConversations();
      setSelectedId(conversation.id);
    } catch (e) {
      setConvError(e instanceof Error ? e.message : "Could not start the conversation.");
    } finally {
      setRosterBusy(null);
    }
  }

  if (convError) return <ErrorState message={convError} onRetry={() => void loadConversations()} />;
  if (!visible || !user) return <Spinner label="Loading messages…" />;

  const selected = visible.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {!compact && (
        <h1 className="font-display text-2xl font-extrabold text-ink-900">
          {title ? `Messages · ${title}` : "Messages"}
        </h1>
      )}

      {roster && roster.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Learners</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {roster.map((p) => {
              const active = visible.some((c) => c.learnerUserId === p.id && c.id === selectedId);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => void openWith(p)}
                  disabled={rosterBusy === p.id}
                  title={`Message ${p.firstName} ${p.lastName}`.trim()}
                  className={cn(
                    "flex w-16 shrink-0 flex-col items-center gap-1 rounded-xl p-1.5 text-center transition disabled:opacity-50",
                    active ? "bg-brand-50" : "hover:bg-slate-50",
                  )}
                >
                  {p.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {initials(p.firstName, p.lastName)}
                    </span>
                  )}
                  <span className="line-clamp-1 w-full text-[11px] font-medium text-ink-700">{p.firstName}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {visible.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          description={
            roster && roster.length > 0
              ? "Pick a learner above to start messaging them."
              : courseId
                ? "Messages with your mentor (or learners) in this course appear here."
                : "Conversations with your mentors or learners appear here."
          }
        />
      ) : (
        <div className={cn("grid gap-4", !compact && "lg:grid-cols-[20rem_1fr]")}>
          <nav aria-label="Conversations" className={cn("flex flex-col gap-1", selectedId && (compact ? "hidden" : "hidden lg:flex"))}>
            {visible.map((c) => {
              const peer = peerOf(c, user.id);
              const active = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex flex-col gap-0.5 rounded-xl border p-3 text-left transition",
                    active ? "border-brand-300 bg-brand-50" : "border-slate-200 bg-white hover:bg-slate-50",
                  )}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-ink-900">
                      {peer.firstName} {peer.lastName}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-slate-500">{c.course.title}</span>
                  {c.lastMessage && <span className="line-clamp-1 text-sm text-slate-500">{c.lastMessage.body}</span>}
                </button>
              );
            })}
          </nav>

          <section aria-label="Conversation" className={cn("flex flex-col rounded-[20px] border border-slate-200 bg-white", !selectedId && (compact ? "hidden" : "hidden lg:flex"))}>
            {!selected ? (
              <p className="p-6 text-sm text-slate-500">Select a conversation.</p>
            ) : (
              <>
                <header className="flex items-center justify-between gap-3 border-b border-slate-200 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900">
                      {peerOf(selected, user.id).firstName} {peerOf(selected, user.id).lastName}
                    </p>
                    <p className="text-xs text-slate-500">{selected.course.title}</p>
                  </div>
                  <button type="button" className={buttonClass("ghost", "sm")} onClick={() => setSelectedId(null)}>
                    <span className={compact ? "" : "lg:hidden"}>Back</span>
                    <span className={compact ? "hidden" : "hidden lg:inline"}>Close</span>
                  </button>
                </header>

                <div className={cn("flex flex-1 flex-col gap-2 overflow-y-auto p-4", compact ? "max-h-[50vh] min-h-[16rem]" : "max-h-[60vh] min-h-[24rem]")}>
                  {hasMore && (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        className={buttonClass("ghost", "sm")}
                        disabled={loadingOlder}
                        onClick={() => {
                          const oldest = messages[0];
                          if (oldest) void loadThread(selected.id, oldest.id);
                        }}
                      >
                        {loadingOlder ? "Loading…" : "Load older messages"}
                      </button>
                    </div>
                  )}
                  {threadLoading ? (
                    <Spinner label="Loading messages…" />
                  ) : messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-400">No messages yet. Say hello.</p>
                  ) : (
                    messages.map((m) => {
                      const mine = m.senderId === user.id;
                      const peer = peerOf(selected, user.id);
                      return (
                        <div key={m.id} className={cn("flex gap-2", mine ? "flex-row-reverse" : "flex-row")}>
                          {!mine && (
                            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-[11px] font-bold text-brand-700">
                              {initials(peer.firstName, peer.lastName)}
                            </span>
                          )}
                          <div className={cn("flex flex-col", mine ? "items-end" : "items-start")}>
                            <div
                              className={cn(
                                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm",
                                mine ? "rounded-br-md bg-brand-600 text-white" : "rounded-bl-md bg-slate-100 text-ink-900",
                              )}
                            >
                              <p className="whitespace-pre-wrap">{m.body}</p>
                            </div>
                            <span className="mt-0.5 text-[11px] text-slate-400">{formatDate(m.createdAt)}</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                {threadError && (
                  <p role="alert" className="px-4 text-sm text-danger">
                    {threadError}
                  </p>
                )}

                <form onSubmit={send} className="flex items-end gap-2 border-t border-slate-200 p-3">
                  <label htmlFor="chat-input" className="sr-only">
                    Message
                  </label>
                  <div className="relative flex-1">
                    <textarea
                      id="chat-input"
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={2}
                      maxLength={4000}
                      placeholder="Write a message…"
                      className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-2.5 pr-10 text-[15px] outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
                    />
                    <Send
                      fontSize="small"
                      aria-hidden
                      className="pointer-events-none absolute right-3 top-3 text-slate-300"
                    />
                  </div>
                  <Button type="submit" loading={sending} disabled={!draft.trim()}>
                    Send
                  </Button>
                </form>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
