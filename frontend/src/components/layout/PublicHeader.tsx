"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Menu from "@mui/icons-material/Menu";
import Close from "@mui/icons-material/Close";
import { cn } from "@/lib/cn";
import LinkButton from "@/components/ui/LinkButton";

const NAV = [
  { href: "/courses", label: "Courses" },
  { href: "/services", label: "Services & Programs" },
  { href: "/work", label: "Our Work" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="EduAltTech home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/brand/logo.png" alt="EduAltTech" width={432} height={436} className="h-8 w-auto" />
        </Link>

        <nav aria-label="Primary" className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition",
                isActive(item.href) ? "text-brand-700" : "text-ink-600 hover:text-ink-900 hover:bg-slate-100",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-2 lg:flex">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-ink-600 hover:text-ink-900"
          >
            Sign in
          </Link>
          <LinkButton href="/signup" size="sm">
            Get started
          </LinkButton>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 lg:hidden"
        >
          {open ? <Close fontSize="small" /> : <Menu fontSize="small" />}
        </button>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-slate-200 bg-white lg:hidden"
      >
        <nav aria-label="Mobile" className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm font-medium",
                    isActive(item.href) ? "bg-brand-50 text-brand-700" : "text-ink-700 hover:bg-slate-100",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-col gap-2 border-t border-slate-200 pt-3">
            <LinkButton href="/signup" className="w-full">
              Get started
            </LinkButton>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-center text-sm font-medium text-ink-600 hover:bg-slate-100"
            >
              Sign in
            </Link>
          </div>
        </nav>
      </div>
    </header>
  );
}
