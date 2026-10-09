import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to your EduAltTech account.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: true },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const reset = Array.isArray(sp.reset) ? sp.reset[0] : sp.reset;
  const expired = Array.isArray(sp.expired) ? sp.expired[0] : sp.expired;
  const notice = reset
    ? "Your password has been updated. Sign in with your new password."
    : expired
      ? "Your session ended. Sign in again to pick up where you left off."
      : undefined;

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to continue to your EduAltTech account.">
      <LoginForm next={next} notice={notice} />
    </AuthShell>
  );
}
