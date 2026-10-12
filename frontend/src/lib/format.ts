export function formatDate(value: string | number | Date, opts?: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat("en-IN", opts ?? { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return "";
  }
}

/** Human countdown like "2h 5m" or "45s". Empty when past or invalid. */
export function formatCountdown(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "";
  const total = Math.ceil(ms / 1000);
  const d = Math.floor(total / 86400);
  const h = Math.floor((total % 86400) / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function localTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "local time";
  }
}

/** Always renders a currency amount (₹0 shows as ₹0, never "Free"). Admin/reporting use. */
export function formatMoney(paise: number, currency = "INR") {
  const n = Number.isFinite(paise) ? paise : 0;
  try {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, maximumFractionDigits: 0 }).format(n / 100);
  } catch {
    return `${currency} ${Math.round(n / 100)}`;
  }
}

export function formatPrice(paise: number, currency = "INR") {
  if (!paise) return "Free";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(paise / 100);
  } catch {
    return `${currency} ${Math.round(paise / 100)}`;
  }
}
