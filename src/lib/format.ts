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
