"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

const pad = (n: number) => String(n).padStart(2, "0");

function parts(target: number, now: number) {
  const s = Math.max(0, Math.floor((target - now) / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
    done: target - now <= 0,
  };
}

function Digit({ d }: { d: string }) {
  return (
    <span className="fc-tile">
      <span key={d} className="fc-digit">
        {d}
      </span>
    </span>
  );
}

function Cell({ value, label }: { value: string; label: string }) {
  return (
    <div className="fc-cell">
      <div className="fc-digits">
        {value.split("").map((d, i) => (
          <Digit key={i} d={d} />
        ))}
      </div>
      <span className="fc-label">{label}</span>
    </div>
  );
}

export default function FlipClock({
  to,
  label,
  className,
  onDone,
}: {
  to: string | number | Date;
  label?: string;
  className?: string;
  onDone?: () => void;
}) {
  const target = new Date(to).getTime();
  const [now, setNow] = useState(() => Date.now());
  const fired = useRef(false);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!fired.current && target - now <= 0) {
      fired.current = true;
      onDone?.();
    }
  }, [target, now, onDone]);

  const p = parts(target, now);

  return (
    <div className={cn("fc-clock", className)} role="timer" aria-label={label ?? "Countdown"}>
      {label && <span className="fc-title">{label}</span>}
      <div className="fc-cells">
        {p.days > 0 && <Cell value={String(p.days)} label="days" />}
        <Cell value={pad(p.hours)} label="hrs" />
        <Cell value={pad(p.minutes)} label="min" />
        <Cell value={pad(p.seconds)} label="sec" />
      </div>
    </div>
  );
}
