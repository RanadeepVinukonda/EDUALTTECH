import type { Metadata } from "next";

export const SITE_NAME = "EduAltTech";
export const DEFAULT_OG_IMAGE = "/media/photos/og-image.jpg";

export const SOCIAL_PROFILES = [
  "https://www.linkedin.com/company/edu-alt-tech",
  "https://www.instagram.com/edu_alt_tech",
  "https://www.youtube.com/channel/UCq3ypxwZISoYOVgJyp0KQFg",
  "https://www.facebook.com/share/1A5wVtFiQc/",
] as const;

export const SITE_DESCRIPTION =
  "EduAltTech (Edu Alt Tech) offers mentor-led courses and free learning resources across coding, AI, design, entrepreneurship, music, sports, agriculture, and practical life skills — based in Kakinada, India.";

export interface PageMetadataInput {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  image?: string | null;
  type?: "website" | "article";
  /** Use exact full title without applying the root `%s · EduAltTech` template. */
  absoluteTitle?: boolean;
}

/**
 * Shared Metadata builder so canonical, OpenGraph, and Twitter cards stay
 * synchronized across every public route.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  keywords,
  image,
  type = "website",
  absoluteTitle = false,
}: PageMetadataInput): Metadata {
  const ogImage = image || DEFAULT_OG_IMAGE;
  const fullTitle = absoluteTitle || title.includes(SITE_NAME) ? title : `${title} · ${SITE_NAME}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(keywords && keywords.length > 0 ? { keywords } : {}),
    alternates: { canonical: path },
    openGraph: {
      type,
      siteName: SITE_NAME,
      locale: "en_IN",
      url: path,
      title: fullTitle,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
  };
}

/** Escapes `<` so CMS strings cannot prematurely close a JSON-LD script tag. */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function breadcrumbSchema(
  base: string,
  items: Array<{ name: string; path: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.path === "/" ? base : `${base}${item.path}`,
    })),
  };
}

export function itemListSchema(
  items: Array<{ name: string; url: string; description?: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      url: item.url,
      ...(item.description ? { description: item.description } : {}),
    })),
  };
}
