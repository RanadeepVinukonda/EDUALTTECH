"use client";

import { useEffect, useRef, useState } from "react";

export default function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: number;
  suffix?: string;
}) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let started = false;
    const run = () => {
      const t0 = performance.now();
      const dur = 1200;
      const tick = (t: number) => {
        const p = Math.min((t - t0) / dur, 1);
        setN(Math.round(value * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        if (e?.isIntersecting && !started) {
          started = true;
          run();
        }
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [value]);

  return (
    <span ref={ref}>
      {n}
      {suffix}
    </span>
  );
}
