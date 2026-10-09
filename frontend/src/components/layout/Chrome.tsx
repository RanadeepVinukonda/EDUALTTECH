"use client";

import { usePathname } from "next/navigation";
import PublicHeader from "./PublicHeader";
import PublicFooter from "./PublicFooter";
import OfflineBanner from "@/components/ui/OfflineBanner";

const APP_PREFIXES = ["/dashboard", "/onboarding", "/checkout"];

export default function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isApp = APP_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  return (
    <>
      <OfflineBanner />
      {!isApp && <PublicHeader />}
      {children}
      {!isApp && <PublicFooter />}
    </>
  );
}
