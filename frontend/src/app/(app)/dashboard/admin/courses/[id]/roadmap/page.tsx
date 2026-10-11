import { redirect } from "next/navigation";

export default async function AdminRoadmapPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/dashboard/admin/courses/${id}?tab=roadmap`);
}