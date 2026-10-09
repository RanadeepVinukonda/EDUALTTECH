"use client";

import { useEffect, useState } from "react";
import CheckCircle from "@mui/icons-material/CheckCircle";
import ErrorOutlined from "@mui/icons-material/ErrorOutlined";
import InfoOutlined from "@mui/icons-material/InfoOutlined";
import { subscribeToasts, type Toast } from "@/lib/notify";
import { cn } from "@/lib/cn";

const ICON = {
  success: CheckCircle,
  error: ErrorOutlined,
  info: InfoOutlined,
} as const;

export default function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(
    () =>
      subscribeToasts((t) => {
        setToasts((prev) => [...prev, t]);
        setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), 4000);
      }),
    [],
  );

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end"
    >
      {toasts.map((t) => {
        const Icon = ICON[t.tone];
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl border px-4 py-3 text-sm shadow-elev2",
              t.tone === "success" && "border-green-300 bg-green-50 text-green-900",
              t.tone === "error" && "border-danger/30 bg-white text-danger",
              t.tone === "info" && "border-slate-200 bg-white text-ink-800",
            )}
          >
            <Icon fontSize="small" className="mt-0.5 shrink-0" />
            <span>{t.message}</span>
          </div>
        );
      })}
    </div>
  );
}
