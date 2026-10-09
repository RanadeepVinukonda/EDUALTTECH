import AdminParticipants from "@/components/app/admin/AdminParticipants";

export default async function AdminCourseParticipantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminParticipants courseId={id} />;
}
