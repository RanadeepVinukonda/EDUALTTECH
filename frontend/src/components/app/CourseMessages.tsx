"use client";

import Link from "next/link";
import { useCourseRoadmap } from "./useCourseRoadmap";
import ChatView from "./ChatView";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/Button";

export default function CourseMessages({ slug }: { slug: string }) {
  const { detail, loading, error, reload } = useCourseRoadmap(slug);

  if (loading) return <Spinner label="Loading messages…" />;
  if (error) return <ErrorState message={error} onRetry={() => void reload()} />;
  if (!detail) return null;

  if (!detail.access.canRead) {
    return (
      <EmptyState
        title="Messages are locked"
        description="Enroll in this course to message your mentor."
        action={
          <Link href={`/courses/${slug}`} className={buttonClass("secondary", "sm")}>
            View course
          </Link>
        }
      />
    );
  }

  return <ChatView courseId={detail.course.id} title={detail.course.title} />;
}
