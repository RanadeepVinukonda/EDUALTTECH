"use client";

import { usePathname } from "next/navigation";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";
import OfflineBanner from "@/components/ui/OfflineBanner";
import DashboardShell from "@/components/app/DashboardShell";
import { useAuth } from "@/components/app/AuthProvider";

// Auth transitions render with no page chrome at all.
const AUTH_BARE = [
  "/login",
  "/signup",
  "/verify-email",
  "/complete-registration",
  "/forgot-password",
  "/reset-password",
  "/onboarding",
  "/reactivate",
  "/auth",
];

// Routes that are bare until signed in, then get the workspace shell.
const AUTH_FLOW = ["/checkout"];

export default function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const { user } = useAuth();

  const matches = (p: string) => pathname === p || pathname.startsWith(`${p}/`);

  const bare = (
    <>
      <OfflineBanner />
      {children}
    </>
  );

  // Dashboard routes supply their own shell and auth redirects.
  if (matches("/dashboard")) return bare;

  if (AUTH_BARE.some(matches)) return bare;

  // Signed-in users see their own workspace nav on every page - never the
  // marketing header/footer.
  if (user) {
    return (
      <>
        <OfflineBanner />
        <DashboardShell>{children}</DashboardShell>
      </>
    );
  }

  if (AUTH_FLOW.some(matches)) return bare;

  return (
    <>
      <OfflineBanner />
      <PublicHeader />
      {children}
      <PublicFooter />
    </>
  );
}
