import type { Metadata } from "next";
import CourseOverviewView from "@/components/app/CourseOverviewView";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Course · ${slug}` };
}

export default async function EnrolledCoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <CourseOverviewView slug={slug} />;
}
