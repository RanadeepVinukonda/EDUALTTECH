"use client";

import { FormEvent, useEffect, useState } from "react";
import { api, getCachedUser } from "@/lib/api";

interface Message {
  id: string;
  body: string;
  createdAt: string;
  senderId: string;
  sender: { name: string; avatarUrl: string | null };
}

// ponytail: 5s polling, same as classroom chat — no sockets until real-time matters.
export function MentorDM({ enrollmentId, courseTitle }: { enrollmentId: string; courseTitle: string }) {
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const me = getCachedUser();

  useEffect(() => {
    let cancelled = false;
    api<{ conversation: { id: string } }>(`/cms/conversations/enrollment/${enrollmentId}`, { method: "POST" })
      .then((d) => {
        if (!cancelled) setConvId(d.conversation.id);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Chat unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, [enrollmentId]);

  useEffect(() => {
    if (!convId) return;
    let cancelled = false;
    let alive = true;
    const poll = async () => {
      try {
        const d = await api<{ messages: Message[] }>(`/cms/conversations/${convId}/messages`);
        if (!cancelled) setMessages(d.messages);
      } catch {
        // transient — retry next tick
      } finally {
        if (alive) window.setTimeout(poll, 5000);
      }
    };
    poll();
    return () => {
      cancelled = true;
      alive = false;
    };
  }, [convId]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !convId) return;
    setDraft("");
    try {
      const d = await api<{ message: Message }>(`/cms/conversations/${convId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setMessages((m) => [...m, d.message]);
    } catch {
      setDraft(body);
    }
  }

  if (error) return <p className="mt-8 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>;
  if (!convId) return <p className="mt-8 text-sm text-slate-400">Opening your 1-on-1 chat…</p>;

  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-6 py-4">
        <h2 className="font-display text-lg font-semibold text-slate-900">Chat with your mentor</h2>
        <p className="text-xs text-slate-500">A private 1-on-1 thread for {courseTitle} — just you and the mentor.</p>
      </header>

      <div className="max-h-80 space-y-3 overflow-y-auto px-6 py-4">
        {messages.length === 0 && <p className="py-6 text-center text-sm text-slate-400">Say hello to your mentor.</p>}
        {messages.map((m) => {
          const mine = m.senderId === me?.id;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${mine ? "brand-grad text-white" : "bg-slate-100 text-slate-800"}`}>
                {!mine && <p className="text-xs font-semibold text-slate-500">{m.sender.name}</p>}
                <p className="whitespace-pre-wrap text-sm">{m.body}</p>
                <p className={`mt-0.5 text-[10px] ${mine ? "text-brand-200" : "text-slate-400"}`}>
                  {new Date(m.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-slate-100 px-6 py-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={2000}
          placeholder="Ask your mentor anything…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="shrink-0 rounded-lg brand-grad px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}