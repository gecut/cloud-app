/**
 * Converts Persian and Arabic digits to standard English ASCII digits.
 */
export function toEnglishDigits(str?: string | null): string {
  if (!str) return "";
  return str
    .replace(/[۰-۹]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1776 + 48))
    .replace(/[٠-٩]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 1632 + 48));
}

/**
 * Normalizes an Iranian mobile phone number to standard 11-digit "09..." format.
 * Handles Persian/Arabic digits, prefixes (+98, 0098, 98), spaces, dashes.
 */
export function normalizePhoneNumber(phone?: string | null): string {
  if (!phone) return "";
  let p = toEnglishDigits(phone).trim();
  p = p.replace(/[\s\-\(\)\+]/g, "");

  if (p.startsWith("0098")) {
    p = "0" + p.slice(4);
  } else if (p.startsWith("98")) {
    p = "0" + p.slice(2);
  } else if (p.length === 10 && p.startsWith("9")) {
    p = "0" + p;
  }

  return p;
}

/**
 * Validates if the string is a valid 11-digit Iranian mobile phone number starting with 09.
 */
export function isValidIranianMobile(phone?: string | null): boolean {
  const normalized = normalizePhoneNumber(phone);
  return /^09\d{9}$/.test(normalized);
}
