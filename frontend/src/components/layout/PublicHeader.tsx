"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Menu from "@mui/icons-material/Menu";
import Close from "@mui/icons-material/Close";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { cn } from "@/lib/cn";
import { hasSession } from "@/lib/auth";
import LinkButton from "@/components/ui/LinkButton";
import BrandLogo from "@/components/brand/BrandLogo";
import ResourcesCategoryMenu, { useResourceTopics } from "@/components/layout/ResourcesCategoryMenu";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/courses", label: "Courses" },
  { href: "/resources", label: "Resources" },
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
];

export default function PublicHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [resourcesMobileOpen, setResourcesMobileOpen] = useState(false);
  const topics = useResourceTopics();
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    setResourcesMobileOpen(false);
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    let active = true;
    hasSession()
      .then((yes) => {
        if (active) setSignedIn(yes);
      })
      .catch(() => {
        if (active) setSignedIn(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-paper/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2" aria-label="Edu Alt Tech home">
          <BrandLogo withWordmark wordmarkClassName="text-sm sm:text-base" />
        </Link>

        <nav aria-label="Primary" className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) =>
            item.href === "/resources" ? (
              <ResourcesCategoryMenu
                key={item.href}
                align="left"
                active={isActive(item.href)}
                triggerClassName={cn(
                  "inline-flex min-h-10 items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                  isActive(item.href) ? "bg-paper-2 text-accent" : "text-ink-2 hover:bg-paper-2 hover:text-ink",
                )}
              />
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                  isActive(item.href) ? "bg-paper-2 text-accent" : "text-ink-2 hover:bg-paper-2 hover:text-ink",
                )}
              >
                {item.label}
              </Link>
            ),
          )}
          <span className="mx-1 h-5 w-px bg-rule" aria-hidden />
          {signedIn ? (
            <Link
              href="/dashboard"
              className="rounded-md px-3.5 py-2 text-sm font-semibold text-accent transition-colors hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Dashboard
            </Link>
          ) : (
            <div className="flex items-center gap-2">
              <LinkButton href="/login" size="sm" variant="secondary">
                Login
              </LinkButton>
              <LinkButton href="/signup" size="sm" variant="primary">
                Get Started
              </LinkButton>
            </div>
          )}
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-md text-ink-2 transition-colors hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus lg:hidden"
        >
          {open ? <Close fontSize="small" /> : <Menu fontSize="small" />}
        </button>
      </div>

      <div
        id="mobile-nav"
        hidden={!open}
        className="border-t border-rule bg-paper lg:hidden"
      >
        <nav aria-label="Mobile" className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) =>
              item.href === "/resources" ? (
                <li key={item.href}>
                  <button
                    type="button"
                    onClick={() => setResourcesMobileOpen((value) => !value)}
                    aria-expanded={resourcesMobileOpen}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                      isActive(item.href) ? "bg-paper-2 text-accent" : "text-ink-2 hover:bg-paper-2",
                    )}
                  >
                    {item.label}
                    <ExpandMore fontSize="small" aria-hidden className={cn("transition-transform", resourcesMobileOpen && "rotate-180")} />
                  </button>
                  {resourcesMobileOpen && (
                    <div className="mb-1 ml-3 space-y-0.5 border-l-2 border-brand-600 py-1 pl-3">
                      {topics.length > 0 ? (
                        topics.map((topic) => (
                          <Link
                            key={topic.slug}
                            href={`/resources#${topic.slug}`}
                            onClick={() => setOpen(false)}
                            className="block rounded-md px-3 py-2 text-sm font-medium text-ink-2 transition-colors hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                          >
                            {topic.name}
                          </Link>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-xs text-slate-500">No tutorials yet.</p>
                      )}
                      <Link
                        href="/resources"
                        onClick={() => setOpen(false)}
                        className="block rounded-md border-t border-rule px-3 py-2 text-sm font-semibold text-accent transition-colors hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                      >
                        All Tutorials
                      </Link>
                    </div>
                  )}
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "block min-h-11 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
                      isActive(item.href) ? "bg-paper-2 text-accent" : "text-ink-2 hover:bg-paper-2",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
          <div className="mt-3 flex flex-col gap-2 border-t border-rule pt-3">
            {signedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-center text-sm font-semibold text-accent transition-colors hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <LinkButton href="/login" variant="secondary" className="w-full">
                  Login
                </LinkButton>
                <LinkButton href="/signup" className="w-full">
                  Get Started
                </LinkButton>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
