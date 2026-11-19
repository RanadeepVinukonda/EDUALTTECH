import type { Metadata } from "next";
import Link from "next/link";
import ChevronRight from "@mui/icons-material/ChevronRight";
import ArrowForward from "@mui/icons-material/ArrowForward";
import LibraryBooks from "@mui/icons-material/LibraryBooks";
import AccessTime from "@mui/icons-material/AccessTime";
import Explore from "@mui/icons-material/Explore";
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

  const totalTutorials = categories.reduce(
    (sum, cat) =>
      sum + cat.articles.length + cat.subcategories.reduce((s, sub) => s + sub.articles.length, 0),
    0,
  );
  const totalMinutes = categories.reduce(
    (sum, cat) =>
      sum +
      cat.articles.reduce((s, a) => s + (a.estimatedMinutes || 0), 0) +
      cat.subcategories.reduce(
        (s, sub) => s + sub.articles.reduce((m, a) => m + (a.estimatedMinutes || 0), 0),
        0,
      ),
    0,
  );

  return (
    <div className="min-h-screen bg-paper">
      {/* Editorial Dot-Grid Library Header */}
      <section
        className="border-b border-rule bg-paper-2 py-12 sm:py-16"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(15, 32, 39, 0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      >
        <div className={wrap}>
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-sm text-muted">
              <li>
                <Link href="/" className="transition-colors hover:text-ink">
                  Home
                </Link>
              </li>
              <li aria-hidden className="text-muted/70">
                <ChevronRight fontSize="small" />
              </li>
              <li className="font-medium text-ink" aria-current="page">
                Resources
              </li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <p className="text-xs font-mono font-semibold uppercase tracking-[0.14em] text-brand-700">
                Open Knowledge Library · Free Forever · No Login Needed
              </p>
              <h1 className="mt-2.5 min-w-0 max-w-2xl break-words font-display text-display-s font-semibold leading-[1.06] tracking-tight text-ink">
                Learn one topic at a time.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-2 sm:text-lg">
                Follow a structured learning trail from foundations to hands-on mini projects — open to students, parents, and curious builders with zero paywall.
              </p>
            </div>

            {/* Live Library Snapshot Card */}
            <div className="lg:col-span-5">
              <div className="overflow-hidden rounded-2xl border border-rule bg-[#ffffff] shadow-elev2">
                <div className="p-5 sm:p-6">
                  <p className="text-[11px] font-mono font-semibold uppercase tracking-[0.12em] text-brand-700">
                    Open Library Snapshot
                  </p>
                  <dl className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-rule/80 bg-paper p-3">
                      <dt className="flex items-center gap-1 text-[11px] font-medium text-muted">
                        <Explore sx={{ fontSize: 13 }} className="text-brand-600" aria-hidden />
                        Paths
                      </dt>
                      <dd className="mt-1 font-display text-xl font-semibold text-ink">
                        {categories.length}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-rule/80 bg-paper p-3">
                      <dt className="flex items-center gap-1 text-[11px] font-medium text-muted">
                        <LibraryBooks sx={{ fontSize: 13 }} className="text-brand-600" aria-hidden />
                        Tutorials
                      </dt>
                      <dd className="mt-1 font-display text-xl font-semibold text-ink">
                        {totalTutorials}
                      </dd>
                    </div>
                    <div className="rounded-xl border border-rule/80 bg-paper p-3">
                      <dt className="flex items-center gap-1 text-[11px] font-medium text-muted">
                        <AccessTime sx={{ fontSize: 13 }} className="text-brand-600" aria-hidden />
                        Reading
                      </dt>
                      <dd className="mt-1 font-display text-xl font-semibold text-ink">
                        {totalMinutes}m
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex items-center justify-between border-t border-rule pt-3.5 text-xs">
                    <span className="font-medium text-ink-2">Want live mentor feedback too?</span>
                    <Link
                      href="/courses"
                      className="inline-flex items-center gap-1 font-semibold text-brand-700 hover:text-brand-800"
                    >
                      Explore courses
                      <ArrowForward sx={{ fontSize: 13 }} aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className={`${wrap} py-10 sm:py-12`}>
        <StructuredResourceLibrary categories={categories} />
      </div>
    </div>
  );
}
