"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/app/AuthProvider";

export default function HomeAuthRedirect() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      router.replace(user.role === "ADMIN" ? "/dashboard/admin" : "/dashboard");
    }
  }, [loading, router, user]);

  return null;
}
