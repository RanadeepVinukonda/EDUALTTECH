import type { Metadata } from "next";
import TeachingWorkspace from "@/components/app/TeachingWorkspace";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Teaching · ${slug}` };
}

export default async function TeachingWorkspacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TeachingWorkspace slug={slug} />;
}
