"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { api, getCachedUser } from "@/lib/api";

interface ChatMessage {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string; role: string; avatarUrl: string | null };
}

// ponytail: 5s polling replaces the list — no websockets until classrooms need real-time scale.
export function CourseChat({ courseId }: { courseId: string }) {
  const [roomId, setRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [hidden, setHidden] = useState(false);
  const [canSend, setCanSend] = useState(false);
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (!getCachedUser()) {
      setHidden(true);
      return;
    }
    let cancelled = false;
    api<{ room: { id: string } }>(`/chat/rooms/course/${courseId}`)
      .then((d) => {
        if (cancelled) return;
        setRoomId(d.room.id);
        setCanSend(true);
      })
      .catch(() => {
        // 401/403 — not a participant (yet): the classroom lives inside the course.
        setHidden(true);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  useEffect(() => {
    if (!roomId) return;
    let cancelled = false;
    let alive = true;
    const poll = async () => {
      try {
        const d = await api<{ messages: ChatMessage[] }>(`/chat/rooms/${roomId}/messages?limit=100`);
        if (!cancelled) setMessages(d.messages);
      } catch {
        // transient — next tick retries
      } finally {
        if (alive) window.setTimeout(poll, 5000);
      }
    };
    poll();
    return () => {
      cancelled = true;
      alive = false;
    };
  }, [roomId]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  if (hidden || !canSend) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || !roomId) return;
    setBody("");
    try {
      const d = await api<{ message: ChatMessage }>(`/chat/rooms/${roomId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body: text }),
      });
      setMessages((m) => [...m, d.message]);
    } catch {
      setBody(text);
    }
  }

  const me = getCachedUser();

  return (
    <section className="mt-10 rounded-2xl border border-slate-200 bg-white">
      <header className="border-b border-slate-100 px-6 py-4">
        <h2 className="font-display text-lg font-semibold text-slate-900">Classroom chat</h2>
        <p className="text-xs text-slate-500">Talk to your mentor and fellow learners — right inside this course.</p>
      </header>

      <ul ref={listRef} className="max-h-80 space-y-3 overflow-y-auto px-6 py-4">
        {messages.map((m) => {
          const mine = me?.id === m.sender.id;
          return (
            <li key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${mine ? "brand-grad text-white" : "bg-slate-100 text-slate-800"}`}>
                <p className={`text-xs font-semibold ${mine ? "text-brand-100" : "text-slate-500"}`}>{m.sender.name}</p>
                <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                <p className={`mt-0.5 text-[10px] ${mine ? "text-brand-200" : "text-slate-400"}`}>
                  {new Date(m.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            </li>
          );
        })}
        {messages.length === 0 && <li className="py-6 text-center text-sm text-slate-400">No messages yet — say hello!</li>}
      </ul>

      <form onSubmit={onSubmit} className="flex gap-2 border-t border-slate-100 px-6 py-4">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={2000}
          placeholder="Ask your mentor anything…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <button
          type="submit"
          disabled={!body.trim()}
          className="shrink-0 rounded-lg brand-grad px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </section>
  );
}