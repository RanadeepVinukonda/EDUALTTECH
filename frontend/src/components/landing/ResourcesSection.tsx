import Link from "next/link";

// Static resource categories - no API call needed
const RESOURCE_CATEGORIES = [
  { id: "ai-ml", name: "AI & Machine Learning", icon: "Brain" },
  { id: "programming", name: "Programming", icon: "Code" },
  { id: "cybersecurity", name: "Cybersecurity", icon: "Shield" },
  { id: "entrepreneurship", name: "Entrepreneurship", icon: "TrendingUp" },
  { id: "music", name: "Music & Singing", icon: "Music" },
  { id: "dance", name: "Dancing", icon: "Dance" },
  { id: "agriculture", name: "Agriculture", icon: "Leaf" },
  { id: "pottery", name: "Pottery & Craft", icon: "Palette" },
];

export default function ResourcesSection() {
  return (
    <section className="border-b border-slate-200 bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl leading-tight">
            Curiosity Should Never Have a Boundary
          </h2>
          <p className="mt-6 text-base leading-relaxed text-slate-600 sm:text-lg max-w-2xl mx-auto">
            Educational articles, tutorials, guides, and topic-based resources. Technical and non-technical learning materials that are accessible and easy to explore.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {RESOURCE_CATEGORIES.map((category) => (
            <div
              key={category.id}
              className="group border rounded-lg border-slate-200 p-6 hover:border-brand-600 transition-colors hover:bg-slate-50"
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center group-hover:bg-brand-600 transition-colors">
                <svg className="w-6 h-6 text-slate-400 group-hover:text-white" aria-hidden="true">
                  {/* Icon placeholder - would use Lucide in actual implementation */}
                </svg>
              </div>
              <h3 className="mt-4 font-display font-medium text-ink-900">{category.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                Tutorials and guides for {category.name.toLowerCase()}
              </p>
              <Link
                href="/resources?type={category.id}"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                Browse resources
                <svg className="arrow-down inline w-2 h-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M7 10l5 5 5-5" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}