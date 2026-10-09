import AdminApplicationReview from "@/components/app/admin/AdminApplicationReview";

export default async function AdminApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminApplicationReview id={id} />;
}
