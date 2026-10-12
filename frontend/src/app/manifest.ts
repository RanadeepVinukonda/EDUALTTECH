import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EduAltTech",
    short_name: "EduAltTech",
    description: "Courses, mentors, and roadmaps for ambitious learners. A product by Setsuzoku.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#038c3e",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/media/brand/logo.png", sizes: "432x436", type: "image/png" },
    ],
  };
}
