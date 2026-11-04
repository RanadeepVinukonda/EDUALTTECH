import Link from "next/link";

const FOOTER_LINKS = {
  about: { title: "About", href: "/about" },
  courses: { title: "Courses", href: "/courses" },
  resources: { title: "Resources", href: "/resources" },
  mentor: { title: "Become a Mentor", href: "/mentor" },
  contact: { title: "Contact", href: "/contact" },
  privacy: { title: "Privacy Policy", href: "/privacy" },
  terms: { title: "Terms & Conditions", href: "/terms" },
};

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="font-display font-semibold text-ink-900 mb-4">
              <svg className="h-6 w-6 mb-2" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 7v5l5 5v5H5v-5L12 7zM12 3V1h2v5l5 5v5h2V3H12z" />
              </svg>
              EduAltTech
            </h3>
            <p className="text-sm text-slate-500">
              Practical and alternative education beyond conventional academic boundaries.
            </p>
          </div>

          {Object.entries(FOOTER_LINKS).map(([key, link]) => (
            <div key={key} className="space-y-3">
              <h4 className="font-display font-medium text-ink-900">{link.title}</h4>
              <ul className="grid grid-cols-2 gap-4 text-sm text-slate-500">
                <li>
                  <Link href={link.href} className="hover:text-ink-900 transition-colors">
                    {link.title}
                  </Link>
                </li>
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-slate-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-400">© {new Date().getFullYear()} EduAltTech.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}