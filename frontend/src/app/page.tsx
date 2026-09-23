import type { Metadata } from "next";
import HomeLanding from "@/components/home/HomeLanding";

export const metadata: Metadata = {
  title: "Edu Alt Tech | Skills Meet Students — Mentors, Tuition & School Tech",
  description:
    "EduAltTech matches skilled people with students who need them. Learn AI, coding and real-world problem solving from practitioner mentors — or become a paid mentor. Digital solutions and marketing for schools in Kakinada, Andhra Pradesh.",
  alternates: { canonical: "https://www.edualttech.com/" },
  openGraph: {
    title: "Edu Alt Tech — Skills Meet Students",
    description:
      "Give a skill or learn one. Mentors, tuition, practice, resources and school tech solutions — Kakinada, Andhra Pradesh.",
    url: "https://www.edualttech.com/",
    siteName: "Edu Alt Tech",
    images: [{ url: "https://www.edualttech.com/og-image.jpg" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Edu Alt Tech — Skills Meet Students",
    description:
      "Give a skill or learn one. Mentors, tuition, practice, resources and school tech solutions — Kakinada, Andhra Pradesh.",
    images: ["https://www.edualttech.com/og-image.jpg"],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Edu Alt Tech",
  url: "https://www.edualttech.com",
  logo: "https://www.edualttech.com/brand/logo.png",
  description:
    "Skills meet students — mentor matching, tuition, practice, resources and technology solutions for schools and franchises.",
  sameAs: [
    "https://in.linkedin.com/company/edu-alt-tech",
    "https://www.instagram.com/edu_alt_tech/",
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <HomeLanding />
    </>
  );
}
