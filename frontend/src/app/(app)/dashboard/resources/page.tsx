import { Suspense } from "react";
import ResourcesView from "@/components/app/ResourcesView";

export const metadata = { title: "Resources" };

export default function ResourcesPage() {
  return (
    <Suspense>
      <ResourcesView />
    </Suspense>
  );
}
