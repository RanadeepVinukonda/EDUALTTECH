import type { Metadata } from "next";
import CourseTabs from "@/components/app/CourseTabs";
import CourseResources from "@/components/app/CourseResources";

export const metadata: Metadata = { title: "Course Resources" };

export default async function CourseResourcesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="space-y-6">
      <CourseTabs slug={slug} />
      <CourseResources slug={slug} />
    </div>
  );
}
