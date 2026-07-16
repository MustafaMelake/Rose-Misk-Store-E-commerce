/**
 * Single source of truth for money formatting across the storefront
 * (cart, checkout, order details). Always renders exactly two decimals with
 * thousands separators, e.g. 1234.5 -> "1,234.50".
 */
export function formatPrice(value: number | string): string {
  const n = Number(value);
  return (Number.isFinite(n) ? n : 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Localized Egyptian-Pound currency formatting for the storefront's
 * Arabic-first audience, e.g. 1234.5 -> "‏١٬٢٣٤٫٥٠ ج.م.‏". Prefer this for
 * user-facing money display; falls back to 0 for non-finite input.
 */
export function formatCurrency(value: number | string): string {
  const n = Number(value);
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
  }).format(Number.isFinite(n) ? n : 0);
}
