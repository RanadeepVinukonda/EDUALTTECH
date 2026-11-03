import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { publicFetch } from "@/lib/server-api";
import type { ResourceLearningPathCategory } from "@/lib/types";
import StructuredResourceLibrary from "@/components/resources/StructuredResourceLibrary";

export const metadata: Metadata = {
  title: "Free Resources & Knowledge Library",
  description:
    "Explore comprehensive, self-paced tutorials and guides across Technology, Computer Science, Academics, Creative Arts, and Professional Skills on EduAltTech. Free forever.",
  alternates: { canonical: "/resources" },
};

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export default async function ResourcesPage() {
  const learningPathData = await publicFetch<{ categories: ResourceLearningPathCategory[] }>(
    "/resources/learning-path",
    {},
    120,
  );
  const categories = learningPathData?.categories ?? [];

  return (
    <div className="min-h-screen bg-paper">
      <section className="border-b border-slate-200 bg-paper-2 py-10 sm:py-14">
        <div className={wrap}>
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-1.5 text-xs text-slate-500">
              <li>
                <Link href="/" className="hover:text-brand-700 transition">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-slate-400">
                <ChevronRight fontSize="small" />
              </li>
              <li className="text-slate-800 font-medium" aria-current="page">
                Resources
              </li>
            </ol>
          </nav>

          <h1 className="min-w-0 max-w-3xl break-words font-display text-display-s font-semibold tracking-tight text-ink-900 leading-tight">
            Learn one topic at a time
          </h1>

          <p className="mt-4 max-w-3xl text-lead leading-relaxed text-ink-600">
            Follow a topic from its foundations through focused tutorials, in order.
          </p>
        </div>
      </section>

      <div className={`${wrap} py-10 sm:py-12`}>
        <StructuredResourceLibrary categories={categories} />
      </div>
    </div>
  );
}
