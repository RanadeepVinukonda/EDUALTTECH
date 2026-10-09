import ResourceDetailView from "@/components/app/ResourceDetailView";

export const metadata = { title: "Resource" };

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResourceDetailView id={id} />;
}
