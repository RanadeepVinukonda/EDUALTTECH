import Link from "next/link";

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
    <div className="bg-slate-50">
      <div className="mx-auto flex max-w-md flex-col px-4 py-12 sm:py-16">
        <Link href="/" className="mx-auto inline-flex items-center gap-2" aria-label="EduAltTech home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/media/brand/logo.svg" alt="EduAltTech" width={128} height={36} className="h-8 w-auto" />
        </Link>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-elev1 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-ink-900">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-ink-600">{subtitle}</p>}
          <div className="mt-6">{children}</div>
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
