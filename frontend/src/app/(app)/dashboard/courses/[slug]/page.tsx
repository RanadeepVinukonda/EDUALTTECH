import type { Metadata } from "next";
import CourseTabs from "@/components/app/CourseTabs";
import CourseOverviewView from "@/components/app/CourseOverviewView";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Course · ${slug.replace(/-/g, " ")}` };
}

export default async function EnrolledCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="space-y-6">
      <CourseTabs slug={slug} />
      <CourseOverviewView slug={slug} />
    </div>
  );
}
