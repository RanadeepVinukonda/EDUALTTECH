import { redirect } from "next/navigation";

export default async function AdminCourseParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/admin/courses/${id}?tab=participants`);
}