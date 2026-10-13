"use client";

import { useEffect, useState } from "react";

export default function Countdown({ to, className }: { to: string; className?: string }) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) return null;

  const diff = new Date(to).getTime() - now;
  if (diff <= 0) return <span className={className}>Starting now</span>;

  const d = Math.floor(diff / 86_400_000);
  const h = Math.floor((diff % 86_400_000) / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  const parts = [d > 0 ? `${d}d` : null, `${h}h`, `${m}m`, `${s}s`].filter(Boolean);

  return <span className={className}>Starts in {parts.join(" ")}</span>;
}
