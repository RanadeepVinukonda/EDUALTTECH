"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { safeNext } from "@/lib/auth";
import Spinner from "@/components/ui/Spinner";
import LinkButton from "@/components/ui/LinkButton";

export default function OAuthCallback({ next }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const providerError = params.get("error") || hash.get("error");
    const providerErrorDesc = params.get("error_description") || hash.get("error_description");

    if (providerError) {
      setError(providerErrorDesc ? providerErrorDesc.replace(/\+/g, " ") : "Sign-in was cancelled or denied.");
      return;
    }

    const sb = getSupabase();
    let done = false;

    const finish = (ok: boolean) => {
      if (done) return;
      done = true;
      // Strip credentials/params from the visible URL before navigating.
      window.history.replaceState(null, "", "/auth/callback");
      if (ok) router.replace(safeNext(next));
      else setError("We could not complete sign-in. Please try again.");
    };

    (async () => {
      const code = params.get("code");
      if (code) {
        const { error: exchangeError } = await sb.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          finish(false);
          return;
        }
      }
      // detectSessionInUrl handles hash-token returns; poll briefly for a session.
      const deadline = Date.now() + 8000;
      while (Date.now() < deadline) {
        const {
          data: { session },
        } = await sb.auth.getSession();
        if (session) return finish(true);
        await new Promise((r) => setTimeout(r, 250));
      }
      finish(false);
    })();

    return undefined;
  }, [next, router]);

  if (error) {
    return (
      <div className="space-y-4">
        <p role="alert" className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
        <LinkButton href="/login" className="w-full">
          Back to sign in
        </LinkButton>
        <p className="text-center text-sm text-ink-600">
          <Link href="/" className="font-semibold text-brand-700 hover:underline">
            Go to home
          </Link>
        </p>
      </div>
    );
  }

  return <Spinner label="Completing sign-in…" />;
}
