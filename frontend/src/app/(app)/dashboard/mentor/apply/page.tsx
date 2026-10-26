import ApplicationForm from "@/components/app/ApplicationForm";

export const metadata = { title: "Apply to Mentor" };

export default async function MentorApplyPage({ searchParams }: { searchParams: Promise<{ course?: string }> }) {
  const { course } = await searchParams;
  return <ApplicationForm initialCourseSlug={course} />;
}
