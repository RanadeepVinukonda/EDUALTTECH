import Link from "next/link";
import BrandLogo from "@/components/brand/BrandLogo";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="min-h-[70vh] bg-paper-2">
      <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:py-20">
        <Link href="/" className="inline-flex items-center gap-2" aria-label="EduAltTech home">
          <BrandLogo withWordmark wordmarkClassName="text-base" />
        </Link>

        <div className="mt-7 rounded-card border border-slate-200 bg-paper p-6 sm:p-8">
          <div className="border-b border-slate-200 pb-5">
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-ink-600">{subtitle}</p>}
          </div>
          <div className="pt-6">{children}</div>
        </div>

        {footer && <div className="mt-6 text-center text-sm text-ink-600">{footer}</div>}

        <p className="mt-8 text-center text-xs leading-relaxed text-slate-500">
          By continuing you agree to our{" "}
          <Link href="/terms" className="font-medium text-brand-700 hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="font-medium text-brand-700 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <p className="mt-3 text-center text-xs text-slate-500">
          <Link href="/" className="hover:text-ink-700">
            &larr; Back to edualttech.com
          </Link>
        </p>
      </div>
    </div>
  );
}
