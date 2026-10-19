/**
 * User-facing date formatting for emails and notifications.
 *
 * The server runs in UTC on most hosts (Render included), so a bare
 * `toLocaleString()` renders UTC and mismatches what the learner sees in the
 * browser (their local time). The product is India-based - always render in a
 * fixed platform timezone. ponytail: single fixed zone; make it an env var only
 * if the platform ever serves multiple regions.
 */
const PLATFORM_TZ = "Asia/Kolkata";

export function formatDateTime(value: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: PLATFORM_TZ,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
