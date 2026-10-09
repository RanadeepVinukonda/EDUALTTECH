"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiGet, SESSION_EXPIRED_EVENT } from "@/lib/api";
import { getSupabase } from "@/lib/supabase";
import { safeNext } from "@/lib/auth";
import type { Me } from "@/lib/app-types";

interface AuthValue {
  user: Me | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const handlingExpiry = useRef(false);

  const load = useCallback(async () => {
    const { data } = await getSupabase().auth.getSession();
    if (!data.session) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user: me } = await apiGet<{ user: Me }>("/auth/me");
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    // Session refreshes / sign-outs flip the profile too (OAuth callback lands here).
    const { data } = getSupabase().auth.onAuthStateChange(() => void load());
    return () => data.subscription.unsubscribe();
  }, [load]);

  // A 401 from any request means the backend rejected our credentials. Clear the
  // session and route to sign-in exactly once, preserving the intended destination.
  useEffect(() => {
    const onExpired = async () => {
      if (handlingExpiry.current) return;
      handlingExpiry.current = true;
      try {
        await getSupabase().auth.signOut();
        setUser(null);
        const here = pathname || "/dashboard";
        if (!here.startsWith("/login")) {
          router.replace(`/login?next=${encodeURIComponent(safeNext(here))}&expired=1`);
        }
      } finally {
        // Re-arm after the redirect settles so a later expiry is handled too.
        window.setTimeout(() => {
          handlingExpiry.current = false;
        }, 1500);
      }
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [router, pathname]);

  const signOut = useCallback(async () => {
    await getSupabase().auth.signOut();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, refresh: load, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
