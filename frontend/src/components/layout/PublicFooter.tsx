import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";

const COLUMNS = [
  {
    title: "Learn",
    links: [
      { href: "/courses", label: "Courses" },
      { href: "/services", label: "Services & Programs" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/work", label: "Our Work" },
      { href: "/partners", label: "Partners" },
      { href: "/team", label: "Team" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/signup", label: "Get started" },
      { href: "/mentor", label: "Become a mentor" },
    ],
  },
];

const LEGAL_LINKS = [
  { href: "/faq", label: "Help & FAQ" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund-policy", label: "Refunds" },
];

export default function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-ink-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <Link href="/" className="inline-flex items-center gap-2" aria-label="EduAltTech home">
              <BrandLogo onDark />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              Courses, alternate education, and tuition for students - taught by skilled people we employ
              as paid mentors. Plus working software built for schools.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-sm font-semibold text-white">{col.title}</h2>
              <ul className="mt-4 space-y-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-slate-400 transition hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} EduAltTech (Edu Alt Tech). A product by Setsuzoku.</p>
          <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-2">
            {LEGAL_LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="transition hover:text-white">
                {l.label}
              </Link>
            ))}
            <a href="mailto:info@edualttech.com" className="transition hover:text-white">
              info@edualttech.com
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
