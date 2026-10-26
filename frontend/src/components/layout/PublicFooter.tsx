import Link from "next/link";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import LinkedInIcon from "@mui/icons-material/LinkedIn";
import XIcon from "@mui/icons-material/X";
import BrandLogo from "@/components/brand/BrandLogo";

// ponytail: social hrefs empty until real links provided — renders as placeholder "#"
const SOCIAL = [
  { label: "Facebook", href: "#", Icon: FacebookIcon },
  { label: "Twitter", href: "#", Icon: XIcon },
  { label: "Instagram", href: "#", Icon: InstagramIcon },
  { label: "LinkedIn", href: "#", Icon: LinkedInIcon },
];

const QUICK_LINKS = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
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
    <footer className="border-t border-slate-200 bg-white text-ink-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Link href="/" className="inline-flex items-center gap-2" aria-label="EduAltTech home">
              <BrandLogo withWordmark />
            </Link>
          </div>

          <div>
            <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
            <nav aria-label="Footer" className="space-y-2 text-sm">
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
            <h3 className="mb-4 text-lg font-semibold">Contact Us</h3>
            <address className="space-y-2 text-sm not-italic text-ink-600">
              <p>
                Email:{" "}
                <a href="mailto:info@edualttech.com" className="transition-colors hover:text-brand-700">
                  info@edualttech.com
                </a>
              </p>
              <p>A product by Setsuzoku.</p>
            </address>
          </div>

          <div className="relative">
            <h3 className="mb-4 text-lg font-semibold">Follow Us</h3>
            <div className="flex space-x-4">
              {SOCIAL.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  title={`Follow us on ${label}`}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 text-ink-700 transition hover:border-brand-600 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40"
                >
                  <Icon fontSize="small" />
                  <span className="sr-only">{label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-8 text-center md:flex-row">
          <p className="text-sm text-ink-500">
            © {new Date().getFullYear()} EduAltTech (Edu Alt Tech). All rights reserved.
          </p>
          <nav aria-label="Legal" className="flex flex-wrap justify-center gap-4 text-sm">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-ink-600 transition-colors hover:text-brand-700"
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
