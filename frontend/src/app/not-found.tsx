"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="face-404-wrap">
      <svg className="face-404" viewBox="0 0 320 380" role="img" aria-label="Page not found">
        <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={25}>
          <g className="face-404__eyes" transform="translate(0,112.5)">
            <g transform="translate(15,0)">
              <polyline className="face-404__eye-lid" points="37,0 0,120 75,120" />
              <polyline className="face-404__pupil" points="55,120 55,155" strokeDasharray="35 35" />
            </g>
            <g transform="translate(230,0)">
              <polyline className="face-404__eye-lid" points="37,0 0,120 75,120" />
              <polyline className="face-404__pupil" points="55,120 55,155" strokeDasharray="35 35" />
            </g>
          </g>
          <rect className="face-404__nose" x="132.5" y="112.5" width={55} height={155} rx={4} ry={4} />
          <g transform="translate(65,334)" strokeDasharray="102 102">
            <path className="face-404__mouth-left" d="M 0 30 C 0 30 40 0 95 0" />
            <path className="face-404__mouth-right" d="M 95 0 C 150 0 190 30 190 30" />
          </g>
        </g>
      </svg>
      <h1 className="font-display mt-6 text-3xl font-bold text-slate-900">This page wandered off</h1>
      <p className="mt-2 max-w-md text-slate-600">The link may be broken or the page may have moved. Try heading home.</p>
      <Link
        href="/"
        className="mt-6 inline-block rounded-xl brand-grad px-6 py-2.5 font-semibold text-white hover:bg-brand-700"
      >
        Back to homepage
      </Link>
    </main>
  );
}