import { headers } from "next/headers";

/**
 * Absolute site origin for canonical/OG/sitemap URLs.
 * Prefers APP_BASE_URL; otherwise derives from the incoming request so deployed
 * sites never emit localhost links.
 */
export async function siteUrl(): Promise<string> {
  const configured = process.env.APP_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const h = await headers().catch(() => null);
  const proto = h?.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "http";
  const host = h?.get("x-forwarded-host")?.split(",")[0]?.trim() ?? h?.get("host") ?? "localhost:3000";
  return `${proto}://${host}`;
}
