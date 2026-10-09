import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create an EduAltTech account to enrol in courses and learn with mentors.",
  alternates: { canonical: "/signup" },
  robots: { index: false, follow: true },
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const next = Array.isArray(sp.next) ? sp.next[0] : sp.next;

  return (
    <AuthShell
      title="Create your account"
      subtitle="Register to enrol in courses and learn with mentors. You are one account — you can learn on some courses and apply to mentor on others."
    >
      <SignupForm next={next} />
    </AuthShell>
  );
}
