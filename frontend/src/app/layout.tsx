import type { Metadata } from "next";
import { Sora, Inter, JetBrains_Mono } from "next/font/google";
import Chrome from "@/components/layout/Chrome";
import Toaster from "@/components/ui/Toaster";
import "./globals.css";

const sora = Sora({ subsets: ["latin"], variable: "--font-sora", weight: ["600", "700", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });

export const metadata: Metadata = {
  title: { default: "EduAltTech — Learn. Build. Grow.", template: "%s · EduAltTech" },
  description: "EduAltTech — courses, mentors, and roadmaps for ambitious learners. A product by Setsuzoku.",
  metadataBase: new URL(process.env.APP_BASE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "EduAltTech",
    description: "Courses, mentors, and roadmaps for ambitious learners.",
    images: ["/media/photos/og-image.jpg"],
  },
};

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
