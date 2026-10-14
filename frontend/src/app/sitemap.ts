import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { publicFetch } from "@/lib/server-api";
import type { CourseListItem } from "@/lib/types";

export const dynamic = "force-dynamic";

const PUBLIC_ROUTES: Array<{ path: string; priority: number; freq: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "", priority: 1, freq: "weekly" },
  { path: "/courses", priority: 0.9, freq: "weekly" },
  { path: "/services", priority: 0.8, freq: "monthly" },
  { path: "/mentor", priority: 0.7, freq: "monthly" },
  { path: "/work", priority: 0.6, freq: "monthly" },
  { path: "/team", priority: 0.6, freq: "monthly" },
  { path: "/partners", priority: 0.5, freq: "monthly" },
  { path: "/about", priority: 0.6, freq: "monthly" },
  { path: "/contact", priority: 0.6, freq: "yearly" },
  { path: "/faq", priority: 0.5, freq: "monthly" },
  { path: "/privacy", priority: 0.3, freq: "yearly" },
  { path: "/terms", priority: 0.3, freq: "yearly" },
  { path: "/refund-policy", priority: 0.3, freq: "yearly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await siteUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((r) => ({
    url: `${base}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }));

  // The backend caps `limit` at 50, so page through the catalogue.
  // ponytail: 40-page ceiling (2000 courses); raise if the catalogue outgrows it.
  const courseEntries: MetadataRoute.Sitemap = [];
  for (let page = 1; page <= 40; page++) {
    const batch = await publicFetch<{ items: CourseListItem[]; hasMore?: boolean }>(
      "/courses",
      { limit: 50, page, sort: "newest" },
      3600,
    );
    const items = batch?.items ?? [];
    for (const c of items) {
      courseEntries.push({
        url: `${base}/courses/${c.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
    if (!batch?.hasMore || items.length === 0) break;
  }

  return [...staticEntries, ...courseEntries];
}
