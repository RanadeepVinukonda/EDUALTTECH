import Link from "next/link";


import LinkedInIcon from "@mui/icons-material/LinkedIn";

import BrandLogo from "@/components/brand/BrandLogo";

// ponytail: only the verified company profile is linked; add others when confirmed.
const SOCIAL = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/edu-alt-tech", Icon: LinkedInIcon },
];

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/resources", label: "Free Resources" },
  { href: "/services#course-demand", label: "Course Demand & Voting" },
  { href: "/services", label: "Services & Programs" },
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
    <footer className="border-t border-slate-200 bg-white text-ink-600">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="EduAltTech home">
              <BrandLogo withWordmark wordmarkClassName="text-lg" />
            </Link>
            <p className="text-sm leading-relaxed text-ink-600 max-w-xs">
              Practical courses in applied AI, engineering systems, and tuition — mentored by skilled practitioners. A product by Setsuzoku.
            </p>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold text-ink-900">Quick links</h3>
            <nav aria-label="Footer" className="space-y-2.5 text-sm">
              {QUICK_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block text-ink-600 transition-colors hover:text-brand-700"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold text-ink-900">Contact &amp; campus</h3>
            <address className="space-y-2.5 text-sm not-italic text-ink-600">
              <p>
                Email:{" "}
                <a href="mailto:info@edualttech.com" className="transition-colors text-brand-700 hover:text-brand-800 underline underline-offset-4 font-medium">
                  info@edualttech.com
                </a>
              </p>
              <p className="text-xs text-slate-500">
                School Partnerships: Genesis, Sharada Vidhyalaya, New Era, MamaSparsh.
              </p>
              <p className="text-xs text-slate-500">A product by Setsuzoku.</p>
            </address>
          </div>

          <div>
            <h3 className="mb-4 font-display text-sm font-semibold text-ink-900">Community</h3>
            <div className="flex space-x-3">
              {SOCIAL.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  title={`Follow us on ${label}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-ink-600 transition hover:border-brand-600 hover:text-white hover:bg-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
                >
                  <Icon fontSize="small" />
                  <span className="sr-only">{label}</span>
                </a>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">
              Updates on courses, mentoring, and school programs.
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-center md:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} EduAltTech (Edu Alt Tech). All rights reserved. Powered by Setsuzoku.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap justify-center gap-5 text-xs">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-ink-600 transition-colors hover:text-ink-900"
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
