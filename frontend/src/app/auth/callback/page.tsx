import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import OAuthCallback from "@/components/auth/OAuthCallback";

export const metadata: Metadata = {
  title: "Signing in",
  robots: { index: false, follow: false },
};

export default async function AuthCallbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = Array.isArray(sp.next) ? sp.next[0] : sp.next;

  return (
    <AuthShell title="Finishing sign-in">
      <OAuthCallback next={next} />
    </AuthShell>
  );
}
