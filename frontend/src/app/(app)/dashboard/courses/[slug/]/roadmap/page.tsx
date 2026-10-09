import type { Metadata } from "next";
import RoadmapView from "@/components/app/RoadmapView";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Roadmap · ${slug}` };
}

export default async function RoadmapPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <RoadmapView slug={slug} />;
}
