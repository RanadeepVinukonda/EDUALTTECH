import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Set a new password",
  description: "Set a new password for your EduAltTech account.",
  alternates: { canonical: "/reset-password" },
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Set a new password" subtitle="Choose a new password for your account.">
      <ResetPasswordForm />
    </AuthShell>
  );
}
