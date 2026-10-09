export function formatDate(value: string | number | Date, opts?: Intl.DateTimeFormatOptions) {
  try {
    return new Intl.DateTimeFormat("en-IN", opts ?? { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  } catch {
    return "";
  }
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
