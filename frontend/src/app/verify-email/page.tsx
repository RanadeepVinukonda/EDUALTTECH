import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import VerifyEmailForm from "@/components/auth/VerifyEmailForm";

export const metadata: Metadata = {
  title: "Verify your email",
  description: "Verify your email address to continue creating your EduAltTech account.",
  alternates: { canonical: "/verify-email" },
  robots: { index: false, follow: false },
};

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const email = Array.isArray(sp.email) ? sp.email[0] : sp.email;
  const next = Array.isArray(sp.next) ? sp.next[0] : sp.next;

  return (
    <AuthShell
      title="Verify your email"
      subtitle="We use a one-time code to confirm the email address belongs to you."
    >
      <VerifyEmailForm emailFromQuery={email} next={next} />
    </AuthShell>
  );
}
