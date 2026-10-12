"use client";

import { usePathname } from "next/navigation";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";
import OfflineBanner from "@/components/ui/OfflineBanner";

const BARE_PREFIXES = [
  "/dashboard",
  "/onboarding",
  "/checkout",
  "/maintenance",
  "/login",
  "/signup",
  "/verify-email",
  "/complete-registration",
  "/forgot-password",
  "/reset-password",
  "/reactivate",
  "/auth",
];

export default function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isBare = BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <>
      <OfflineBanner />
      {!isBare && <PublicHeader />}
      {children}
      {!isBare && <PublicFooter />}
    </>
  );
}
