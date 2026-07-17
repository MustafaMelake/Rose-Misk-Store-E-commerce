/**
 * Single source of truth for user-facing money formatting across the whole
 * app (storefront and admin): localized Egyptian-Pound currency for the
 * Arabic-first audience, e.g. 1234.5 -> "‏١٬٢٣٤٫٥٠ ج.م.‏".
 * Falls back to 0 for non-finite input.
 */
export function formatCurrency(value: number | string): string {
  const n = Number(value);
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
  }).format(Number.isFinite(n) ? n : 0);
}

/**
 * Single source of truth for user-facing date formatting: Arabic (Egypt)
 * locale, e.g. 2026-05-24 -> "٢٤ مايو ٢٠٢٦".
 */
export function formatDate(value: Date | string | number): string {
  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}
