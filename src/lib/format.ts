/**
 * Single source of truth for user-facing money formatting across the whole
 * app (storefront and admin). Renders Egyptian Pounds in English formatting
 * with Western Arabic numerals, e.g. 1234.5 -> "EGP 1,234.50".
 * Falls back to 0 for non-finite input.
 */
export function formatCurrency(value: number | string): string {
  const n = Number(value);
  // `en-US` guarantees the ISO "EGP" prefix + Western digits (`en-EG` may
  // localize the symbol). Currency stays EGP.
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EGP",
  }).format(Number.isFinite(n) ? n : 0);
}

/**
 * Single source of truth for user-facing date formatting: English (US) locale,
 * e.g. 2026-05-24 -> "May 24, 2026". Dates are always rendered in Egypt's
 * timezone (`Africa/Cairo`) regardless of where the server or client runs, so
 * a customer and the admin never see an order dated a day apart.
 */
export function formatDate(value: Date | string | number): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Cairo",
  }).format(new Date(value));
}
