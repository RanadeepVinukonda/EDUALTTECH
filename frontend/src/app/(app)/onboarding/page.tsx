import type { Metadata } from "next";
import OnboardingFlow from "@/components/app/OnboardingFlow";

export const metadata: Metadata = { title: "Welcome" };

export default function OnboardingPage() {
  return <OnboardingFlow />;
}
