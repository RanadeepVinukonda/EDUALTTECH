"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";

interface ChatSummary { id: string; title: string; isSaved: boolean }
interface ChatMessage { id: string; role: string; content: string }

export default function AssistantPage() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api<{ chats: ChatSummary[] }>("/ai/chats").then((d) => setChats(d.chats)).catch(() => undefined);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function openChat(id: string) {
    setActiveId(id);
    const d = await api<{ chat: { messages: ChatMessage[] } }>(`/ai/chats/${id}`);
    setMessages(d.chat.messages);
  }

  async function deleteChat(id: string) {
    await api(`/ai/chats/${id}`, { method: "DELETE" }).catch(() => undefined);
    setChats((c) => c.filter((x) => x.id !== id));
    if (activeId === id) {
      setActiveId(null);
      setMessages([]);
    }
  }

  async function send() {
    const message = input.trim();
    if (!message || busy) return;
    setBusy(true);
    setInput("");
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, role: "user", content: message }]);
    try {
      const d = await api<{ chatId: string; reply: string }>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ chatId: activeId ?? undefined, message, save: true }),
      });
      setMessages((m) => [...m, { id: `a-${Date.now()}`, role: "assistant", content: d.reply }]);
      setActiveId(d.chatId);
      api<{ chats: ChatSummary[] }>("/ai/chats").then((r) => setChats(r.chats)).catch(() => undefined);
    } catch (err) {
      setMessages((m) => [...m, { id: `e-${Date.now()}`, role: "assistant", content: err instanceof Error ? err.message : "Something went wrong." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[260px_1fr]">
      {/* Saved chats */}
      <aside className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="font-display text-sm font-semibold uppercase tracking-wide text-slate-500">Saved chats</p>
        <ul className="mt-3 space-y-1">
          {chats.length === 0 && <li className="text-sm text-slate-400">No chats yet</li>}
          {chats.map((c) => (
            <li key={c.id} className="group flex items-center gap-1">
              <button
                onClick={() => openChat(c.id)}
                className={`flex-1 truncate rounded-lg px-3 py-2 text-left text-sm ${
                  activeId === c.id ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {c.title}
              </button>
              <button
                onClick={() => deleteChat(c.id)}
                aria-label={`Delete chat ${c.title}`}
                className="rounded-md p-1.5 text-slate-300 hover:text-red-500 group-hover:text-slate-400"
              >
                ×
              </button>
            </li>
            ))}
        </ul>
      </aside>

      {/* Chat area */}
      <div className="flex h-[70vh] flex-col rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-3">
          <p className="font-display font-semibold text-slate-900">AI study assistant</p>
          <p className="text-xs text-slate-500">Ask anything about your subjects — history is saved automatically.</p>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.length === 0 && (
            <p className="text-center text-sm text-slate-400">
              Start with: “Explain photosynthesis like I&apos;m in class 7” 
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                  m.role === "user" ? "bg-brand-600 text-white" : "bg-slate-100 text-slate-800"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2 border-t border-slate-100 p-4">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
            placeholder="Ask your question…"
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          />
          <button
            onClick={send}
            disabled={busy}
            className="rounded-xl bg-brand-600 px-5 py-2.5 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? "…" : "Send"}
          </button>
        </div>
      </div>
    </div>
  );
}
