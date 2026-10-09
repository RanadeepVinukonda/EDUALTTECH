import type { Metadata } from "next";
import AuthShell from "@/components/auth/AuthShell";
import CompleteRegistrationForm from "@/components/auth/CompleteRegistrationForm";

export const metadata: Metadata = {
  title: "Complete registration",
  description: "Finish creating your EduAltTech account.",
  alternates: { canonical: "/complete-registration" },
  robots: { index: false, follow: false },
};

export default function CompleteRegistrationPage() {
  return (
    <AuthShell
      title="Complete registration"
      subtitle="Add your name and password to finish setting up your account."
    >
      <CompleteRegistrationForm />
    </AuthShell>
  );
}
