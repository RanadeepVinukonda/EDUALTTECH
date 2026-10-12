import LinkButton from "@/components/ui/LinkButton";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center px-4 py-28 text-center sm:px-6 lg:px-8">
      <svg viewBox="0 0 120 120" role="img" aria-label="Lost face" className="nf-face h-28 w-28">
        <defs>
          <linearGradient id="nf-face-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#038C3E" />
            <stop offset="1" stopColor="#026B2F" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="52" fill="url(#nf-face-bg)" />
        <ellipse className="nf-eye" cx="46" cy="52" rx="6" ry="9" fill="#fff" />
        <ellipse className="nf-eye nf-eye-r" cx="74" cy="52" rx="6" ry="9" fill="#fff" />
        <path
          d="M50 78c3-3 7-4.5 10-4.5s7 1.5 10 4.5"
          fill="none"
          stroke="#fff"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <circle cx="40" cy="66" r="4" fill="#fff" opacity="0.28" />
        <circle cx="80" cy="66" r="4" fill="#fff" opacity="0.28" />
      </svg>
      <p className="mt-6 font-mono text-sm font-semibold text-brand-700">404</p>
      <h1 className="mt-4 font-display text-3xl font-bold text-ink-900 sm:text-4xl">Page not found</h1>
      <p className="mt-4 max-w-md text-lg text-ink-600">
        The course or page you are looking for may have been removed, unpublished, or never existed.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href="/courses">Browse courses</LinkButton>
        <LinkButton href="/" variant="secondary">
          Go home
        </LinkButton>
      </div>
    </div>
  );
}
