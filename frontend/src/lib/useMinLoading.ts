"use client";

import { useEffect, useState } from "react";

export function useMinLoading(ready: boolean, ms = 2000): boolean {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (!ready) {
      setShow(true);
      return;
    }
    const t = setTimeout(() => setShow(false), ms);
    return () => clearTimeout(t);
  }, [ready, ms]);

  return show;
}