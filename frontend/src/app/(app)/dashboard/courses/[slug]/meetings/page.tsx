import type { Metadata } from "next";
import CourseTabs from "@/components/app/CourseTabs";
import CourseMeetings from "@/components/app/CourseMeetings";

export const metadata: Metadata = { title: "Course Meetings" };

export default async function CourseMeetingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="space-y-6">
      <CourseTabs slug={slug} />
      <CourseMeetings slug={slug} />
    </div>
  );
}
