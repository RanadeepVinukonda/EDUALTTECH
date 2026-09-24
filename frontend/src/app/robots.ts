import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/dashboard", "/profile", "/orders", "/notifications", "/teacher"] }],
    sitemap: "https://www.edualttech.com/sitemap.xml",
  };
}