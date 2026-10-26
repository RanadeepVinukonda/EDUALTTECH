import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { siteUrl } from "@/lib/site";
import Chrome from "@/components/layout/Chrome";
import AuthProvider from "@/components/app/AuthProvider";
import Toaster from "@/components/ui/Toaster";
import "./globals.css";

const SITE_NAME = "EduAltTech";
const SITE_DESCRIPTION =
  "Edu Alt Tech (EduAltTech) — courses, mentors, and structured roadmaps for ambitious learners. Learn in-demand skills with real mentors. A product by Setsuzoku.";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
};

const sora = localFont({
  src: "./fonts/sora-latin.woff2",
  variable: "--font-sora",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});
const inter = localFont({
  src: "./fonts/inter-latin.woff2",
  variable: "--font-inter",
  fallback: ["ui-sans-serif", "system-ui", "sans-serif"],
});
const jetbrains = localFont({
  src: "./fonts/jetbrains-mono-latin.woff2",
  variable: "--font-jetbrains",
  fallback: ["ui-monospace", "monospace"],
});

export async function generateMetadata(): Promise<Metadata> {
  // metadataBase drives absolute canonical/OG URLs. Prefer the configured
  // APP_BASE_URL; otherwise derive from the request so deployed sites never
  // emit localhost links by accident.
  const metadataBase = new URL(await siteUrl());

  // Search-engine ownership verification. Set these env vars after creating the
  // property in Google Search Console / Bing Webmaster Tools. Unset ⇒ no tag.
  const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim();
  const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim();
  const verification: Metadata["verification"] = {};
  if (googleVerification) verification.google = googleVerification;
  if (bingVerification) verification.other = { "msvalidate.01": bingVerification };

  return {
    metadataBase,
    title: { default: "EduAltTech — Learn. Build. Grow.", template: "%s · EduAltTech" },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
    keywords: [
      "EduAltTech",
      "Edu Alt Tech",
      "EduTech",
      "Edu Tech",
      "edtech India",
      "online courses India",
      "learn AI",
      "entrepreneurship courses",
      "tech mentorship",
      "structured roadmaps",
      "career skills",
    ],
    authors: [{ name: "Setsuzoku" }],
    creator: "Setsuzoku",
    publisher: "Setsuzoku",
    category: "education",
    alternates: { canonical: "/" },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    ...(Object.keys(verification).length ? { verification } : {}),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "en_IN",
      url: "/",
      title: "EduAltTech — Learn. Build. Grow.",
      description: SITE_DESCRIPTION,
      images: [{ url: "/media/photos/og-image.jpg", width: 1200, height: 630, alt: "EduAltTech" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "EduAltTech — Learn. Build. Grow.",
      description: SITE_DESCRIPTION,
      images: ["/media/photos/og-image.jpg"],
    },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const base = await siteUrl();
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${base}/#organization`,
        name: SITE_NAME,
        alternateName: ["Edu Alt Tech", "EduTech", "Edu Tech"],
        url: base,
        logo: `${base}/media/brand/logo.png`,
        description: SITE_DESCRIPTION,
        email: "info@edualttech.com",
        foundingDate: "2024",
        sameAs: ["https://www.linkedin.com/company/edu-alt-tech"],
        address: {
          "@type": "PostalAddress",
          addressLocality: "Kakinada",
          addressRegion: "Andhra Pradesh",
          addressCountry: "IN",
        },
      },
      {
        "@type": "WebSite",
        "@id": `${base}/#website`,
        url: base,
        name: SITE_NAME,
        inLanguage: "en-IN",
        publisher: { "@id": `${base}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${base}/courses?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <html lang="en" suppressHydrationWarning className={`${sora.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <AuthProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:font-semibold focus:text-ink-900 focus:shadow-elev2"
          >
            Skip to content
          </a>
          <Chrome>
            <main id="main" className="flex-1">
              {children}
            </main>
          </Chrome>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
