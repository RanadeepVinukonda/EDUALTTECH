const ORIGIN = process.env.BACKEND_ORIGIN ?? "http://localhost:5000";

type Query = Record<string, string | number | undefined>;

/**
 * Server-side fetch for public (unauthenticated) content.
 * Unwraps the backend envelope and returns the payload, or null on any
 * failure so a single section can degrade without blocking the page.
 */
export async function publicFetch<T>(path: string, query: Query = {}, revalidate = 300): Promise<T | null> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) params.set(k, String(v));
  }
  const qs = params.toString();

  try {
    const res = await fetch(`${ORIGIN}/api${path}${qs ? `?${qs}` : ""}`, { next: { revalidate } });
    if (!res.ok) return null;
    const json = (await res.json()) as { success?: boolean; data?: T };
    return json.success && json.data !== undefined ? json.data : null;
  } catch {
    return null;
  }
}

/**
 * Like publicFetch, but distinguishes "not found / unpublished" (data = null,
 * error = false) from a network/server failure (error = true) so the caller can
 * render a distinct state instead of a misleading 404.
 */
export async function publicFetchStrict<T>(
  path: string,
  query: Query = {},
  revalidate = 60,
): Promise<{ data: T | null; error: boolean }> {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v !== undefined) params.set(k, String(v));
  }
  const qs = params.toString();

  try {
    const res = await fetch(`${ORIGIN}/api${path}${qs ? `?${qs}` : ""}`, { next: { revalidate } });
    if (res.status === 404) return { data: null, error: false };
    if (!res.ok) return { data: null, error: true };
    const json = (await res.json()) as { success?: boolean; data?: T };
    if (!json.success || json.data === undefined) return { data: null, error: false };
    return { data: json.data, error: false };
  } catch {
    return { data: null, error: true };
  }
}
