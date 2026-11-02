import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import { publicFetch } from "@/lib/server-api";
import type { ResourceCategoryItem, ResourceArticleCard } from "@/lib/types";
import ResourceLibraryExplorer from "@/components/resources/ResourceLibraryExplorer";

export const metadata: Metadata = {
  title: "Free Resources & Knowledge Library",
  description:
    "Explore comprehensive, self-paced tutorials and guides across Technology, Computer Science, Academics, Creative Arts, and Professional Skills on EduAltTech. Free forever.",
  alternates: { canonical: "/resources" },
};

const wrap = "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8";

export default async function ResourcesPage() {
  const [categoriesData, articlesData, featuredData] = await Promise.all([
    publicFetch<{ categories: ResourceCategoryItem[] }>("/resources/categories", {}, 120),
    publicFetch<{ articles: ResourceArticleCard[] }>("/resources/library", {}, 120),
    publicFetch<{ featured: ResourceArticleCard[] }>("/resources/featured", {}, 120),
  ]);

  const categories = categoriesData?.categories ?? [];
  const initialArticles = articlesData?.articles ?? [];
  const initialFeatured = featuredData?.featured ?? [];

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Header Section */}
      <section className="border-b border-slate-200 bg-slate-50 py-12 sm:py-16">
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

          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-ink-900 leading-tight">
            Explore learning resources
          </h1>

          <p className="mt-4 max-w-3xl text-base sm:text-lg leading-relaxed text-slate-600">
            Learn at your own pace without mandatory enrollment or paywalls. Explore structured tutorials across
            Computer Science, Academic Disciplines, Creative & Performing Arts, and Leadership.
          </p>

          <p className="mt-6 text-sm font-medium text-slate-500">
            Free and open access · Step-by-step guides and code examples · Direct bridges to mentor-led courses
          </p>
        </div>
      </section>

      {/* Main Interactive Explorer */}
      <div className={`${wrap} py-10 sm:py-12`}>
        <ResourceLibraryExplorer
          initialCategories={categories}
          initialArticles={initialArticles}
          initialFeatured={initialFeatured}
        />
      </div>
    </div>
  );
}
