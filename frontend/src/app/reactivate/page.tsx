import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import ReactivateForm from "@/components/auth/ReactivateForm";

export const metadata: Metadata = {
  title: "Reactivate your account",
  description: "Reactivate your EduAltTech account.",
  robots: { index: false, follow: false },
};

export default async function ReactivatePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const email = Array.isArray(sp.email) ? sp.email[0] : sp.email;

  return (
    <AuthShell
      title="Reactivate your account"
      subtitle="Your account has been deactivated. Re-enter your password to restore access — your courses, messages, and progress are all kept."
    >
      <ReactivateForm email={email} />
    </AuthShell>
  );
}