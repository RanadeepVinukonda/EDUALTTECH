export type ClassValue = string | number | null | undefined | false | Record<string, boolean>;

export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const v of values) {
    if (!v) continue;
    if (typeof v === "string" || typeof v === "number") out.push(String(v));
    else for (const [k, on] of Object.entries(v)) if (on) out.push(k);
  }
  return out.join(" ");
}
