"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCachedUser, subscribeAuth, type User } from "@/lib/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const refresh = () => setUser(getCachedUser());
    refresh();
    const unsub = subscribeAuth(refresh);
    setChecked(true);
    return unsub;
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!user) router.replace("/login");
    else if (user.role !== "ADMIN") router.replace("/dashboard");
  }, [user, checked, router]);

  if (!checked || !user || user.role !== "ADMIN") {
    return <p className="py-20 text-center text-sm text-slate-500">Checking access…</p>;
  }

  return <>{children}</>;
}