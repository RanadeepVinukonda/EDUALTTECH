import type { Metadata } from "next";
import CourseTabs from "@/components/app/CourseTabs";
import RoadmapView from "@/components/app/RoadmapView";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Roadmap · ${slug}` };
}

export default async function RoadmapPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return (
    <div className="space-y-6">
      <CourseTabs slug={slug} />
      <RoadmapView slug={slug} />
    </div>
  );
}
