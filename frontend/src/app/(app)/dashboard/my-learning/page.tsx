import type { Metadata } from "next";
import MyLearningView from "@/components/app/MyLearningView";

export const metadata: Metadata = { title: "My Learning" };

export default function MyLearningPage() {
  return <MyLearningView />;
}
