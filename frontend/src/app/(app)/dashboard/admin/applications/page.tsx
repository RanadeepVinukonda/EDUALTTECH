import { Suspense } from "react";
import AdminApplications from "@/components/app/admin/AdminApplications";

export default function AdminApplicationsPage() {
  return (
    <Suspense fallback={null}>
      <AdminApplications />
    </Suspense>
  );
}
