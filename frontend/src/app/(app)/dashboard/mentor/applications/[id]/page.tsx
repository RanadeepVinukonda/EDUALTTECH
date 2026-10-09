import ApplicationDetailView from "@/components/app/ApplicationDetailView";

export const metadata = { title: "Application" };

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ApplicationDetailView id={id} />;
}
