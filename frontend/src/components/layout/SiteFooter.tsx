import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-ink-800">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          <p className="font-display text-lg font-semibold text-white">Edu-Alt-Tech</p>
          <p className="mt-2 text-sm text-ink-200">
            The skill marketplace of the <span className="font-semibold text-white">Setsuzoku</span> group — digital solutions and marketing &amp; admissions alongside.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Platform</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-200">
            <li><Link href="/courses" className="hover:text-brand-300">Courses</Link></li>
            <li><Link href="/practice" className="hover:text-brand-300">Practice zone</Link></li>
            <li><Link href="/resources" className="hover:text-brand-300">Resources</Link></li>
            <li><Link href="/assistant" className="hover:text-brand-300">AI assistant</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">For schools</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-200">
            <li><Link href="/about" className="hover:text-brand-300">What we offer</Link></li>
            <li><Link href="/services" className="hover:text-brand-300">Services</Link></li>
            <li><Link href="/teachers/apply" className="hover:text-brand-300">Teach with us</Link></li>
            <li><Link href="/contact" className="hover:text-brand-300">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Setsuzoku group</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-200">
            <li>Edu-Alt-Tech — skill marketplace</li>
            <li>Digital solutions</li>
            <li>Marketing &amp; admissions</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-900 py-4 text-center text-xs text-ink-300">
        © {new Date().getFullYear()} Setsuzoku · Edu-Alt-Tech. All rights reserved.
      </div>
    </footer>
  );
}
