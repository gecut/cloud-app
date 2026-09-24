/**
 * Formats a monetary Toman value.
 * If the amount is 0 (or null/undefined), returns "رایگان" by default.
 */
export function formatToman(amount?: number | null, fallbackFree = true): string {
  const val = Number(amount || 0);
  if (val === 0 && fallbackFree) {
    return "رایگان";
  }
  return `${val.toLocaleString("fa-IR")} تومان`;
}
