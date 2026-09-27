"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCachedUser, nextAuthPath } from "@/lib/api";

export function RedirectAuthed() {
  const router = useRouter();
  useEffect(() => {
    const user = getCachedUser();
    if (user) router.replace(nextAuthPath(user));
  }, [router]);
  return null;
}