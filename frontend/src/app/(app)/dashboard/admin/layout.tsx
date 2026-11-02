"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/app/AuthProvider";
import Spinner from "@/components/ui/Spinner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (!loading && user && !isAdmin) router.replace("/dashboard");
  }, [loading, user, isAdmin, router]);

  if (loading || !user) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner label="Checking admin access..." />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner label="Redirecting..." />
      </div>
    );
  }

  return <>{children}</>;
}
