"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Instagram, Mail, MessageCircle, Phone } from "lucide-react";

const INSTAGRAM_URL = "https://www.instagram.com/edu_alt_tech/";
const EMAIL = "info@edualttech.com";
const PHONE = "";
const WHATSAPP = "";

function phoneHref(value: string): string {
  return `tel:${value.replace(/[^+\d]/g, "")}`;
}

function whatsappHref(value: string): string {
  return `https://wa.me/${value.replace(/[^+\d]/g, "")}`;
}

export function SiteFooter() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;
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
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">For schools</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-200">
            <li><Link href="/organizations" className="hover:text-brand-300">Partner schools</Link></li>
            <li><Link href="/about" className="hover:text-brand-300">What we offer</Link></li>
            <li><Link href="/services" className="hover:text-brand-300">Services</Link></li>
            <li><Link href="/contact" className="hover:text-brand-300">Contact</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Connect</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-200">
            <li>
              <a href={`mailto:${EMAIL}`} className="inline-flex items-center gap-2 hover:text-brand-300">
                <Mail className="h-4 w-4" aria-hidden /> {EMAIL}
              </a>
            </li>
            <li>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-brand-300">
                <Instagram className="h-4 w-4" aria-hidden /> @edu_alt_tech
              </a>
            </li>
            {PHONE ? (
              <li>
                <a href={phoneHref(PHONE)} className="inline-flex items-center gap-2 hover:text-brand-300">
                  <Phone className="h-4 w-4" aria-hidden /> {PHONE}
                </a>
              </li>
            ) : null}
            {WHATSAPP ? (
              <li>
                <a href={whatsappHref(WHATSAPP)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-brand-300">
                  <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-900 py-4 text-center text-xs text-ink-300">
        © {new Date().getFullYear()} Setsuzoku · Edu-Alt-Tech. All rights reserved.
      </div>
    </footer>
  );
}
