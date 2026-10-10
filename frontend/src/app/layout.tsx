import type { Metadata } from "next";
import { headers } from "next/headers";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import Chrome from "@/components/layout/Chrome";
import Toaster from "@/components/ui/Toaster";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export async function generateMetadata(): Promise<Metadata> {
  // metadataBase drives absolute canonical/OG URLs. Prefer the configured
  // APP_BASE_URL; otherwise derive from the request so deployed sites never
  // emit localhost links by accident.
  const h = await headers().catch(() => null);
  const proto = h?.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "http";
  const host = h?.get("x-forwarded-host")?.split(",")[0]?.trim() ?? h?.get("host") ?? "localhost:3000";
  const metadataBase = new URL(process.env.APP_BASE_URL ?? `${proto}://${host}`);

  return {
    title: { default: "EduAltTech — Learn. Build. Grow.", template: "%s · EduAltTech" },
    description: "EduAltTech — courses, mentors, and roadmaps for ambitious learners. A product by Setsuzoku.",
    metadataBase,
    openGraph: {
      title: "EduAltTech",
      description: "Courses, mentors, and roadmaps for ambitious learners.",
      images: ["/media/photos/og-image.jpg"],
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body className="flex min-h-dvh flex-col font-sans">
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
      </body>
    </html>
  );
}
