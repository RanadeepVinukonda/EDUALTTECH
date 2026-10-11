"use client";

import Link from "next/link";
import { useCourseRoadmap } from "./useCourseRoadmap";
import MeetingManager from "./MeetingManager";
import Spinner from "@/components/ui/Spinner";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";
import { buttonClass } from "@/components/ui/Button";

export default function CourseMeetings({ slug }: { slug: string }) {
  const { detail, loading, error, reload } = useCourseRoadmap(slug);

  if (loading) return <Spinner label="Loading meetings…" />;
  if (error) return <ErrorState message={error} onRetry={() => void reload()} />;
  if (!detail) return null;

  if (!detail.access.canRead) {
    return (
      <EmptyState
        title="Meetings are locked"
        description="Enroll in this course to see its live sessions."
        action={
          <Link href={`/courses/${slug}`} className={buttonClass("secondary", "sm")}>
            View course
          </Link>
        }
      />
    );
  }

  return <MeetingManager courseId={detail.course.id} readOnly={!detail.access.isStaff} />;
}
