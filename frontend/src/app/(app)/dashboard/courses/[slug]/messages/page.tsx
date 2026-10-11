import type { Metadata } from "next";
import CourseTabs from "@/components/app/CourseTabs";
import CourseMessages from "@/components/app/CourseMessages";

export const metadata: Metadata = { title: "Course messages" };

export default async function CourseMessagesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="space-y-6">
      <CourseTabs slug={slug} />
      <CourseMessages slug={slug} />
    </div>
  );
}
