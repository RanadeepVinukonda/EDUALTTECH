/**
 * Generates the course-card thumbnails (1200x675 PNG) from a designed SVG.
 *
 *   cd backend && npx tsx scripts/generate-course-thumbnails.ts
 *
 * Output: frontend/public/media/courses/<slug>.jpg
 * Abstract, per-course gradient art - deliberately not stock/AI imagery.
 */
import { mkdirSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { COURSES, type CourseSeed } from "./course-catalog";

const OUT_DIR = path.resolve(process.cwd(), "../frontend/public/media/courses");

function hslToHex(h: number, s: number, l: number): string {
  const a = (s / 100) * Math.min(l / 100, 1 - l / 100);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l / 100 - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * c)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Distinct, readable level colors (pill background; white text on top).
const LEVEL_COLOR: Record<CourseSeed["level"], string> = {
  Beginner: hslToHex(150, 60, 40),
  Intermediate: hslToHex(36, 92, 48),
  Advanced: hslToHex(350, 68, 52),
};

function buildSvg(c: CourseSeed): string {
  const h = c.hue;
  const accent = (h + 190) % 360;
  const bg1 = hslToHex(h, 70, 24);
  const bg2 = hslToHex((h + 32) % 360, 66, 11);
  const glow = hslToHex(accent, 88, 60);
  const label = hslToHex(accent, 90, 74);
  const ring = hslToHex(accent, 85, 62);

  const longest = Math.max(...c.lines.map((l) => l.length));
  const fs = longest <= 9 ? 86 : longest <= 13 ? 74 : longest <= 18 ? 62 : 54;
  const lh = Math.round(fs * 1.08);
  const bottom = 562;
  const startY = bottom - (c.lines.length - 1) * lh;
  const domainY = startY - Math.round(fs * 0.92);
  const title = c.lines.map((l, i) => `<tspan x="84" y="${startY + i * lh}">${esc(l)}</tspan>`).join("");
  const levelFill = LEVEL_COLOR[c.level];
  const pillW = 52 + c.level.length * 12;

  return `<svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${bg1}"/>
      <stop offset="1" stop-color="${bg2}"/>
    </linearGradient>
    <radialGradient id="g1" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="${glow}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${glow}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="50%" cy="50%" r="50%">
      <stop offset="0" stop-color="${ring}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${ring}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.5" fill="#ffffff" fill-opacity="0.09"/>
    </pattern>
  </defs>

  <rect width="1200" height="675" fill="url(#bg)"/>
  <circle cx="985" cy="150" r="360" fill="url(#g1)"/>
  <circle cx="210" cy="600" r="330" fill="url(#g2)"/>
  <circle cx="985" cy="150" r="196" fill="none" stroke="${ring}" stroke-opacity="0.28" stroke-width="2"/>
  <circle cx="985" cy="150" r="120" fill="none" stroke="#ffffff" stroke-opacity="0.16" stroke-width="1.5" stroke-dasharray="6 10"/>
  <rect x="880" y="430" width="220" height="220" rx="46" fill="#ffffff" fill-opacity="0.05" transform="rotate(14 990 540)"/>
  <rect width="1200" height="675" fill="url(#dots)"/>

  <g>
    <rect x="84" y="70" rx="19" width="${pillW}" height="40" fill="${levelFill}"/>
    <circle cx="108" cy="90" r="5" fill="#ffffff" fill-opacity="0.92"/>
    <text x="124" y="98" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="20" font-weight="700"
      letter-spacing="1.6" fill="#ffffff">${esc(c.level.toUpperCase())}</text>
  </g>

  <text x="84" y="${domainY}" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="23" font-weight="700"
    letter-spacing="3.4" fill="${label}">${esc(c.domain.toUpperCase())}</text>

  <text font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="${fs}" font-weight="800" fill="#ffffff">${title}</text>

  <rect x="84" y="612" width="64" height="6" rx="3" fill="${label}"/>
  <text x="1116" y="631" font-family="Segoe UI, Arial, Helvetica, sans-serif" font-size="22" font-weight="700"
    fill="#ffffff" fill-opacity="0.6" text-anchor="end">EduAltTech</text>
</svg>`;
}

async function main(): Promise<void> {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const c of COURSES) {
    const out = path.join(OUT_DIR, `${c.slug}.jpg`);
    await sharp(Buffer.from(buildSvg(c))).jpeg({ quality: 88, mozjpeg: true }).toFile(out);
    console.log(`[thumb] ${c.slug}.jpg`);
  }
  console.log(`[thumb] done - ${COURSES.length} files in ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
