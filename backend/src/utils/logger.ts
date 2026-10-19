type Level = "debug" | "info" | "warn" | "error";

const LEVELS: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const configured = (process.env.LOG_LEVEL ?? "info") as Level;

const SENSITIVE = /(password|token|secret|authorization|signature|otp)/i;

function scrub(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(scrub);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) =>
        SENSITIVE.test(k) ? [k, "[redacted]"] : [k, scrub(v)],
      ),
    );
  }
  return value;
}

/** Structured JSON logs. Never pass secrets in `meta` - keys matching SENSITIVE are redacted (recursively). */
function log(level: Level, msg: string, meta?: Record<string, unknown>) {
  if (LEVELS[level] < LEVELS[configured]) return;
  const safe = meta ? (scrub(meta) as Record<string, unknown>) : undefined;
  const line = JSON.stringify({ ts: new Date().toISOString(), level, msg, ...safe });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (msg: string, meta?: Record<string, unknown>) => log("debug", msg, meta),
  info: (msg: string, meta?: Record<string, unknown>) => log("info", msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => log("warn", msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => log("error", msg, meta),
};
