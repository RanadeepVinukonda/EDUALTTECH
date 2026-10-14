"use client";

import CourseCard, { type CourseCardCourse } from "@/components/landing/CourseCard";
import { useAuth } from "@/components/app/AuthProvider";

/** Short client-local meeting label, e.g. "Oct 15, 6:00 PM". */
export function meetingLabel(iso: string): string {
  return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

/**
 * Public-surface course tile that becomes state-aware once the visitor is
 * signed in: enrolled courses link to the learner portal, mentored courses to
 * the teaching workspace and show mentor stats. Anonymous visitors get the
 * plain catalogue card (identical render on the server, so no hydration drift).
 */
export default function CourseCardLive({ course, className }: { course: CourseCardCourse; className?: string }) {
  const { memberships } = useAuth();
  const m = memberships.get(course.slug);

  if (!m) return <CourseCard course={course} className={className} />;

  if (m.role === "MENTOR") {
    return (
      <CourseCard
        course={course}
        href={`/dashboard/mentor/courses/${course.slug}`}
        badge="Mentoring"
        priceLabel="Mentoring"
        viewLabel="Open teaching workspace"
        className={className}
        stats={[
          { label: "Students", value: String(m.students) },
          { label: "Lessons live", value: `${m.lessonsPublished}/${m.lessonsTotal}` },
          { label: "Next meeting", value: m.nextMeetingAt ? meetingLabel(m.nextMeetingAt) : "Not scheduled" },
        ]}
      />
    );
  }

  return (
    <CourseCard
      course={course}
      href={`/dashboard/courses/${course.slug}`}
      badge="Enrolled"
      priceLabel="Enrolled"
      viewLabel={m.progressPct > 0 ? "Continue" : "Start learning"}
      progressPct={m.progressPct}
      mentor={m.mentor}
      className={className}
    />
  );
}
