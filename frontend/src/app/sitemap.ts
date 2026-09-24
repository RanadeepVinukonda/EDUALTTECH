import type { MetadataRoute } from "next";

const BASE = "https://www.edualttech.com";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/courses`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/practice`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/resources`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/work`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/setsuzoku`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/services`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/about`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE}/contact`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE}/teacher`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE}/teachers/apply`, changeFrequency: "monthly", priority: 0.6 },
  ];
}