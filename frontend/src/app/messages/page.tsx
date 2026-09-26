"use client";

import { FormEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { Loader } from "@/components/Loader";
import { useMinLoading } from "@/lib/useMinLoading";

interface Conversation {
  id: string;
  title: string | null;
  createdAt: string;
  mentor: { id: string; name: string; avatarUrl: string | null };
  enrollment: { id: string; course: { title: string; slug: string }; studentId: string };
  _count: { messages: number };
}

interface Message {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  sender: { name: string; avatarUrl: string | null };
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<Loader />}>
      <Messages />
    </Suspense>
  );
}

function Messages() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [active, setActive] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [meId, setMeId] = useState<string>("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const showLoader = loading || useMinLoading(!loading);

  const loadList = useCallback(() => {
    api<{ conversations: Conversation[] }>("/cms/conversations")
      .then((d) => {
        setConversations(d.conversations);
        const pending = searchParams.get("enrollment");
        if (pending && !active) {
          const existing = d.conversations.find((c) => c.enrollment.id === pending);
          if (existing) setActive(existing.id);
          else openNew(pending, d.conversations);
        } else if (!active && d.conversations.length > 0) {
          setActive(d.conversations[0].id);
        }
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const openNew = async (enrollmentId: string, list: Conversation[]) => {
    try {
      const { conversation } = await api<{ conversation: Conversation }>(
        `/cms/conversations/enrollment/${enrollmentId}`,
        { method: "POST" }
      );
      const merged = [conversation, ...list.filter((c) => c.id !== conversation.id)];
      setConversations(merged);
      setActive(conversation.id);
    } catch {
      // silent — mentor may be unassigned; page still shows list
    }
  };

  useEffect(loadList, [loadList]);

  const loadMessages = useCallback((id: string) => {
    api<{ messages: Message[] }>(`/cms/conversations/${id}/messages`).then((d) => {
      setMessages(d.messages);
      setMeId(d.messages.find((m) => m.sender.name)?.senderId ?? "");
    });
    api<{ user: { id: string } }>("/auth/me")
      .then((d) => setMeId(d.user.id))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!active) return;
    loadMessages(active);
  }, [active, loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!active || !draft.trim()) return;
    setSending(true);
    try {
      const { message } = await api<{ message: Message }>(`/cms/conversations/${active}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: draft }),
      });
      setMessages((m) => [...m, message]);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="mx-auto flex max-w-6xl gap-6 px-4 py-10">
      <section className="w-72 shrink-0">
        <h1 className="font-display text-xl font-bold text-slate-900">Messages</h1>
        <p className="mt-1 text-xs text-slate-500">One chat per course, mentor ↔ student.</p>
        {showLoader ? (
          <Loader />
        ) : conversations.length === 0 ? (
          <p className="mt-6 rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500">
            No conversations yet. Students can open a chat from any course they are enrolled in.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  onClick={() => setActive(c.id)}
                  className={`w-full rounded-xl p-3 text-left text-sm transition ${
                    active === c.id ? "brand-grad text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <span className="block font-semibold">{c.title ?? c.enrollment.course.title}</span>
                  <span className={`block text-xs ${active === c.id ? "text-brand-100" : "text-slate-500"}`}>
                    {c.mentor.name} · {c._count.messages} messages
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex min-h-[60vh] flex-1 flex-col rounded-2xl border border-slate-200 bg-white">
        {!active ? (
          <p className="m-auto text-sm text-slate-400">Select a conversation.</p>
        ) : (
          <>
            <header className="border-b border-slate-100 px-5 py-3">
              <h2 className="text-sm font-bold text-slate-800">{conversations.find((c) => c.id === active)?.title ?? "Chat"}</h2>
            </header>
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-5">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.senderId === meId ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      m.senderId === meId ? "brand-grad text-white" : "bg-white text-slate-800"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{m.body}</p>
                    <p className={`mt-1 text-[10px] ${m.senderId === meId ? "text-brand-100" : "text-slate-400"}`}>
                      {m.sender.name} · {new Date(m.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <form onSubmit={send} className="flex gap-2 border-t border-slate-100 p-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a message…"
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
              />
              <button
                disabled={sending || !draft.trim()}
                className="rounded-xl brand-grad px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </>
        )}
      </section>
    </main>
  );
}