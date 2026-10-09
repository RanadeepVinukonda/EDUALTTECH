"use client";

import { useAuth } from "@/components/app/AuthProvider";
import AdminDashboard from "@/components/app/admin/AdminDashboard";

export default function AdminOverviewPage() {
  const { user } = useAuth();
  return <AdminDashboard firstName={user?.firstName} />;
}
