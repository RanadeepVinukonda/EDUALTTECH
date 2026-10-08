import { prisma } from "./prisma.js";

export const DEFAULT_MENTOR_CAPACITY = 20;

/** Platform-wide configurable values (Setting.value is Json). */
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (!row) return fallback;
  return row.value as T;
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value: value as never },
    create: { key, value: value as never },
  });
}

/** Mentor seat default — Setting `mentor_capacity`, falling back to 20. */
export async function mentorCapacityDefault(): Promise<number> {
  const v = await getSetting<number | string>("mentor_capacity", DEFAULT_MENTOR_CAPACITY);
  const n = typeof v === "string" ? Number(v) : v;
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_MENTOR_CAPACITY;
}
