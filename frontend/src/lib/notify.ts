"use client";

export type Tone = "success" | "error" | "info";
export interface Toast {
  id: number;
  message: string;
  tone: Tone;
}

let seq = 0;
const listeners = new Set<(t: Toast) => void>();

export function notify(message: string, tone: Tone = "info"): void {
  const toast: Toast = { id: ++seq, message, tone };
  listeners.forEach((l) => l(toast));
}

export const notifySuccess = (m: string) => notify(m, "success");
export const notifyError = (m: string) => notify(m, "error");

export function subscribeToasts(cb: (t: Toast) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
