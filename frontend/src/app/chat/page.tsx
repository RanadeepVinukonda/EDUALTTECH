"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";

interface Room {
  id: string;
  title: string | null;
  createdAt: string;
  course: { id: string; title: string; slug: string };
  _count: { messages: number };
  messages: Array<{ id: string; body: string; createdAt: string }>;
}

interface Message {
  id: string;
  body: string;
  createdAt: string;
  sender: { id: string; name: string; role: string; avatarUrl: string | null };
}

const SCOPE_LABEL: Record<string, string> = { CLASSROOM: "Classroom", DIRECT: "Direct" };

export default function ChatPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ rooms: Room[] }>("/chat/rooms")
      .then((d) => setRooms(d.rooms))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Could not load your classrooms"));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function openRoom(id: string) {
    setActiveId(id);
    setError(null);
    setMessages([]);
    try {
      const d = await api<{ messages: Message[] }>(`/chat/rooms/${id}/messages?limit=50`);
      setMessages(d.messages);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load messages");
    }
  }

  async function send() {
    const body = input.trim();
    if (!body || !activeId || busy) return;
    setBusy(true);
    setInput("");
    try {
      const d = await api<{ message: Message }>(`/chat/rooms/${activeId}/messages`, {
        method: "POST",
        body: JSON.stringify({ body }),
      });
      setMessages((m) => [...m, d.message]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Message could not be sent");
    } finally {
      setBusy(false);
    }
  }

  const activeRoom = rooms.find((r) => r.id === activeId);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-slate-900">Course chat</h1>
      <p className="mt-1 text-slate-600">
        Rooms for courses you teach and courses you learn in. Participants only — the backend enforces it.
      </p>

      {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="mt-8 grid gap-6 lg:grid-cols-[300px_1fr]">
        {/* Rooms */}
        <aside className="rounded-2xl border border-slate-200 bg-white p-3">
          <p className="px-2 pb-2 font-display text-sm font-semibold uppercase tracking-wide text-slate-500">Rooms</p>
          {rooms.length === 0 && !error ? (
            <p className="px-2 py-6 text-center text-sm text-slate-400">
              No rooms yet. Enroll in a course to join its classroom.
            </p>
          ) : (
            <ul className="space-y-1">
              {rooms.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => openRoom(r.id)}
                    className={`w-full rounded-xl px-3 py-2.5 text-left ${activeId === r.id ? "bg-brand-50" : "hover:bg-slate-50"}`}
                  >
                    <p className={`truncate text-sm font-medium ${activeId === r.id ? "text-brand-800" : "text-slate-800"}`}>
                      {r.course.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {SCOPE_LABEL[r.title ?? "CLASSROOM"] ?? "Classroom"} · {r._count.messages} messages
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Conversation */}
        <div className="flex h-[65vh] flex-col rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div>
              {activeRoom ? (
                <>
                  <p className="font-display font-semibold text-slate-900">{activeRoom.course.title}</p>
                  <Link href={`/courses/${activeRoom.course.slug}`} className="text-xs text-brand-700 hover:underline">
                    Course page
                  </Link>
                </>
              ) : (
                <p className="text-sm text-slate-500">Pick a room to open the conversation.</p>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {activeId && messages.length === 0 && (
              <p className="text-center text-sm text-slate-400">No messages yet — say hello.</p>
            )}
            {messages.map((m) => (
              <div key={m.id}>
                <p className="text-xs text-slate-500">{m.sender.name}</p>
                <div className="mt-0.5 inline-block max-w-[85%] whitespace-pre-wrap rounded-xl rounded-tl-sm bg-slate-100 px-4 py-2 text-sm text-slate-800">
                  {m.body}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          <div className="flex gap-2 border-t border-slate-100 p-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), send())}
              disabled={!activeId}
              placeholder={activeId ? "Write a message…" : "Pick a room first"}
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 disabled:bg-slate-50"
            />
            <button
              onClick={send}
              disabled={!activeId || busy || input.trim().length === 0}
              className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? "…" : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}