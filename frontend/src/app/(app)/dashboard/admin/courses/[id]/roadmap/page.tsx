import AdminRoadmapBuilder from "@/components/app/admin/AdminRoadmapBuilder";

export default async function AdminRoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminRoadmapBuilder courseId={id} />;
}
