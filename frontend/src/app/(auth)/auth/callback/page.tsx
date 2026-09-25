"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { api, persistAuthTokens, nextAuthPath, type AuthResponse } from "@/lib/api";

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [state, setState] = useState<"working" | "verified" | "failed">("working");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const oauth = params.get("oa") === "1";
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const code = params.get("code");
      const err = hash.get("error_description") ?? hash.get("error") ?? params.get("error");
      if (err) {
        setState("failed");
        setMessage(typeof err === "string" ? err : "The link failed.");
        return;
      }

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (oauth) {
        const accessToken = hash.get("access_token") ?? (url && anon ? null : null);
        // PKCE flow returns a ?code= to exchange; implicit flow (default for
        // server-initiated OAuth) returns #access_token directly.
        let importToken: string | null = accessToken;
        let importRefresh: string | null = hash.get("refresh_token");
        if (!importToken && code && url && anon) {
          const supabase = createClient(url, anon, { auth: { flowType: "pkce" } });
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error || !data.session) {
            setState("failed");
            setMessage(error?.message ?? "Could not complete the sign-in.");
            return;
          }
          importToken = data.session.access_token;
          importRefresh = data.session.refresh_token;
        }
        if (!importToken) {
          setState("failed");
          setMessage("The sign-in link is incomplete. Try again.");
          return;
        }
        // Sync the profile row (first-time OAuth users) and set session cookies
        // when the backend runs in cookie mode; otherwise returns the tokens.
        const imported = await api<AuthResponse>("/auth/oauth/import", {
          method: "POST",
          body: JSON.stringify({
            accessToken: importToken,
            refreshToken: importRefresh,
          }),
        });
        persistAuthTokens(imported);
        router.replace(nextAuthPath(imported.user));
        router.refresh();
        return;
      }

      if (code) {
        if (url && anon) {
          const supabase = createClient(url, anon);
          await supabase.auth.exchangeCodeForSession(code); // marks confirmed at Supabase
        }
      } else if (!hash.get("access_token")) {
        setState("failed");
        setMessage("The confirmation link is incomplete.");
        return;
      }

      // Let the signup tab know, so it can flip to "Email verified — sign in".
      const pending = localStorage.getItem("eat:pending-verify");
      if (pending) {
        localStorage.setItem(`eat:email-verified:${pending}`, Date.now().toString());
        localStorage.removeItem("eat:pending-verify");
      }

      setState("verified");
    })();
  }, [params, router]);

  if (state === "working") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-elev2">
        <h1 className="font-display text-xl font-bold text-slate-900">Confirming your email…</h1>
        <p className="mt-2 text-sm text-slate-600">This should only take a moment.</p>
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-elev2">
        <h1 className="font-display text-xl font-bold text-slate-900">Could not confirm your email</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <Link href="/login" replace className="mt-4 inline-block font-semibold text-brand-700 hover:text-brand-800">
          Sign in instead
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-elev2">
      <h1 className="font-display text-xl font-bold text-slate-900">Email verified</h1>
      <p className="mt-2 text-sm text-slate-600">Your account is active. Sign in to continue to your dashboard.</p>
      <Link
        href="/login"
        replace
        className="mt-4 inline-block rounded-xl brand-grad px-6 py-2.5 font-semibold text-white hover:bg-brand-700"
      >
        Go to login
      </Link>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <Suspense fallback={<p className="text-slate-500">Loading…</p>}>
        <CallbackInner />
      </Suspense>
    </div>
  );
}