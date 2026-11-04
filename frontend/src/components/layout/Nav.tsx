"use client";

import { useState } from "react";
import Link from "next/link";
import { MenuOutlined, CloseOutlined } from "@mui/icons-material";

export function Nav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="border-b border-rule bg-paper fixed top-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-4">
          <Link href="/" className="font-display font-semibold text-ink-900 text-lg">
            EduAltTech
          </Link>
          <button
            aria-label="Open menu"
            onClick={() => toggleMobileMenu()}
            className="md:hidden p-2 text-ink-600"
          >
            <MenuOutlined className="h-6 w-6" />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/courses" className="text-slate-600 hover:text-ink-900 font-medium transition-colors">
            Courses
          </Link>
          <Link href="/resources" className="text-slate-600 hover:text-ink-900 font-medium transition-colors">
            Resources
          </Link>
          <Link href="/mentor" className="text-slate-600 hover:text-ink-900 font-medium transition-colors">
            Become a Mentor
          </Link>
          <Link href="/about" className="text-slate-600 hover:text-ink-900 font-medium transition-colors">
            About
          </Link>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-ink-900/75 z-40 flex items-center justify-center p-4">
          <button
            aria-label="Close menu"
            onClick={() => closeMobileMenu()}
            className="absolute top-6 right-6 p-2 text-white"
          >
            <CloseOutlined className="h-6 w-6" />
          </button>
          <div className="flex flex-col gap-8 w-full max-w-md">
            <Link href="/courses" className="font-display font-medium text-ink-900 hover:text-brand-600 transition-colors">
              Courses
            </Link>
            <Link href="/resources" className="font-display font-medium text-ink-900 hover:text-brand-600 transition-colors">
              Resources
            </Link>
            <Link href="/mentor" className="font-display font-medium text-ink-900 hover:text-brand-600 transition-colors">
              Become a Mentor
            </Link>
            <Link href="/about" className="font-display font-medium text-ink-900 hover:text-brand-600 transition-colors">
              About
            </Link>
            <div className="pt-8 border-t border-slate-200">
              <button
                onClick={() => closeMobileMenu()}
                className="w-full py-3 font-display font-semibold text-brand-600 bg-white rounded-lg hover:bg-slate-50 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}