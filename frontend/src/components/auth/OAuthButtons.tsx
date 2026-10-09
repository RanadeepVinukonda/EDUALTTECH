"use client";

import { useState } from "react";
import Google from "@mui/icons-material/Google";
import Microsoft from "@mui/icons-material/Microsoft";
import { apiPost } from "@/lib/api";
import Button from "@/components/ui/Button";

const PROVIDERS = [
  { id: "google", label: "Continue with Google", Icon: Google },
  { id: "azure", label: "Continue with Microsoft", Icon: Microsoft },
] as const;

export default function OAuthButtons({ next }: { next?: string }) {
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function start(provider: string) {
    setPending(provider);
    setError("");
    try {
      const redirectTo =
        next && next !== "/"
          ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
          : `${window.location.origin}/auth/callback`;
      const { url } = await apiPost<{ url: string }>("/auth/oauth/url", { provider, redirectTo }, { auth: false });
      window.location.assign(url);
    } catch {
      setPending(null);
      setError("Could not start sign-in with that provider. Please try again or use your email.");
    }
  }

  return (
    <div className="space-y-3">
      {PROVIDERS.map(({ id, label, Icon }) => (
        <Button
          key={id}
          type="button"
          variant="secondary"
          className="w-full"
          loading={pending === id}
          disabled={pending !== null}
          onClick={() => start(id)}
        >
          <Icon fontSize="small" />
          {label}
        </Button>
      ))}
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
