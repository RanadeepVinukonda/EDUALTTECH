"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasSession } from "@/lib/auth";

export default function HomeAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    hasSession()
      .then((yes) => {
        if (active && yes) router.replace("/dashboard");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [router]);

  return null;
}
