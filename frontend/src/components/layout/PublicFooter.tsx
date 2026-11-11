import Link from "next/link";


import LinkedInIcon from "@mui/icons-material/LinkedIn";
import InstagramIcon from "@mui/icons-material/Instagram";
import YouTubeIcon from "@mui/icons-material/YouTube";
import FacebookIcon from "@mui/icons-material/Facebook";

import BrandLogo from "@/components/brand/BrandLogo";

const SOCIAL = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/edu-alt-tech", Icon: LinkedInIcon },
  { label: "Instagram", href: "https://www.instagram.com/edu_alt_tech?rpxt=dDAwM3NuOTBxd3V1", Icon: InstagramIcon },
  { label: "YouTube", href: null, Icon: YouTubeIcon },
  { label: "Facebook", href: "https://www.facebook.com/share/1A5wVtFiQc/", Icon: FacebookIcon },
];

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/resources", label: "Free Resources" },
  { href: "/services#course-demand", label: "Vote on courses" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/faq", label: "Help & FAQ" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
  { href: "/refund-policy", label: "Refunds" },
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-rule bg-paper text-ink-2">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-4 sm:col-span-2 lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="EduAltTech home">
              <BrandLogo withWordmark wordmarkClassName="text-lg" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-ink-2">
              Practical courses in applied AI, engineering systems, and tuition, mentored by skilled practitioners. A product by Setsuzoku.
            </p>
          </div>

          <div className="lg:col-span-2">
            <h3 className="mb-4 font-display text-sm font-semibold text-ink">Explore</h3>
            <nav aria-label="Footer" className="space-y-2 text-sm">
              {QUICK_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block w-fit text-ink-2 transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-3">
            <h3 className="mb-4 font-display text-sm font-semibold text-ink">Contact &amp; campus</h3>
            <address className="space-y-2.5 text-sm not-italic text-ink-2">
              <p>
                Email:{" "}
                <a href="mailto:info@edualttech.com" className="font-medium text-accent underline underline-offset-4 transition-colors hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus">
                  info@edualttech.com
                </a>
              </p>
              <p className="text-xs text-muted">
                School Partnerships: Genesis, Sharada Vidhyalaya, New Era, MamaSparsh.
              </p>
              <p className="text-xs text-muted">A product by Setsuzoku.</p>
            </address>
          </div>

          <div className="lg:col-span-3">
            <h3 className="mb-4 font-display text-sm font-semibold text-ink">Community</h3>
            <div className="flex space-x-3">
              {SOCIAL.map(({ label, href, Icon }) => {
                const className =
                  "inline-flex h-10 w-10 items-center justify-center rounded-md border border-rule bg-paper text-ink-2";
                const icon = <Icon fontSize="small" />;

                return href ? (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Follow us on ${label}`}
                    aria-label={`Follow EduAltTech on ${label}`}
                    className={`${className} transition-colors hover:border-accent hover:bg-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus`}
                  >
                    {icon}
                  </a>
                ) : (
                  <span
                    key={label}
                    title={`${label} profile link coming soon`}
                    aria-label={`${label} profile link coming soon`}
                    className={`${className} cursor-not-allowed opacity-50`}
                  >
                    {icon}
                  </span>
                );
              })}
            </div>
            <p className="mt-4 max-w-xs text-xs text-muted">
              Updates on courses, mentoring, and school programs.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-5 border-t border-rule pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} EduAltTech (Edu Alt Tech). All rights reserved. Powered by Setsuzoku.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-ink-2 transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
