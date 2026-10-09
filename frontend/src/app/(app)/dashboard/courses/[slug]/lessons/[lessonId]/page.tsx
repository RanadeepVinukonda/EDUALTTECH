import type { Metadata } from "next";
import LessonViewer from "@/components/app/LessonViewer";

export const metadata: Metadata = { title: "Lesson" };

export default async function LessonPage({ params }: { params: Promise<{ slug: string; lessonId: string }> }) {
  const { slug, lessonId } = await params;
  return <LessonViewer slug={slug} lessonId={lessonId} />;
}
