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

/**
 * Generates a direct Telegram chat URL (https://t.me/...) from a phone number or telegram chat ID/username.
 * For Iranian numbers, formats to international format (+989...).
 */
export function getTelegramChatUrl(phone?: string | null, telegramChatId?: string | null): string | null {
  if (telegramChatId) {
    const cleanId = telegramChatId.trim();
    if (cleanId.startsWith("@")) {
      return `https://t.me/${cleanId.slice(1)}`;
    }
    // If it's a valid Telegram username (letters, digits, underscores, min 4 chars)
    if (/^[a-zA-Z][a-zA-Z0-9_]{3,}$/.test(cleanId)) {
      return `https://t.me/${cleanId}`;
    }
  }

  const raw = (phone || telegramChatId || "").trim();
  if (!raw) return null;

  const english = toEnglishDigits(raw).replace(/[^0-9+]/g, "");
  if (!english) return null;

  let intl = english;
  if (intl.startsWith("00")) {
    intl = "+" + intl.slice(2);
  } else if (intl.startsWith("0")) {
    intl = "+98" + intl.slice(1);
  } else if (intl.startsWith("98")) {
    intl = "+" + intl;
  } else if (!intl.startsWith("+")) {
    intl = "+98" + intl;
  }

  return `https://t.me/${intl}`;
}
