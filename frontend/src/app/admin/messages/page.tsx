"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";

interface Message {
  id: string;
  name: string;
  email: string;
  school: string | null;
  subject: string | null;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api<{ messages: Message[] }>("/admin/messages")
      .then((d) => setMessages(d.messages))
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load"));
  }, []);

  useEffect(load, [load]);

  async function markRead(m: Message) {
    await api(`/admin/messages/${m.id}`, { method: "PATCH", body: JSON.stringify({ isRead: !m.isRead }) });
    load();
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-slate-900">Contact messages</h1>
      {error && <p className="mt-4 text-red-600">{error}</p>}
      <div className="mt-6 space-y-3">
        {messages.length === 0 && <p className="text-slate-500">Inbox is empty.</p>}
        {messages.map((m) => (
          <article key={m.id} className={`rounded-2xl border bg-white p-5 ${m.isRead ? "border-slate-200" : "border-brand-300"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">
                  {m.subject || "(no subject)"}
                  {!m.isRead && <span className="ml-2 rounded-full bg-brand-600 px-2 py-0.5 text-xs text-white">NEW</span>}
                </p>
                <p className="text-sm text-slate-500">
                  {m.name} · {m.email}{m.school ? ` · ${m.school}` : ""}
                </p>
              </div>
              <button onClick={() => markRead(m)} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
                {m.isRead ? "Mark unread" : "Mark read"}
              </button>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{m.body}</p>
            <p className="mt-2 text-xs text-slate-400">{new Date(m.createdAt).toLocaleString()}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
