export function parseToDate(dateInput: Date | string | number | null | undefined): Date | null {
  if (!dateInput) return null;
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

/**
 * Formats a date to Persian Solar (Jalali) numerical format e.g. "۱۴۰۴/۰۶/۲۴"
 */
export function formatJalaliDate(
  dateInput: Date | string | number | null | undefined,
  fallback = "-",
): string {
  const date = parseToDate(dateInput);
  if (!date) return fallback;

  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return fallback;
  }
}

/**
 * Formats a date to Persian Solar (Jalali) words format e.g. "۲۴ شهریور ۱۴۰۴"
 */
export function formatJalaliDateWords(
  dateInput: Date | string | number | null | undefined,
  fallback = "-",
): string {
  const date = parseToDate(dateInput);
  if (!date) return fallback;

  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  } catch {
    return fallback;
  }
}

/**
 * Formats a date to Persian Solar (Jalali) date and time e.g. "۱۴۰۴/۰۶/۲۴، ۲۱:۴۵"
 */
export function formatJalaliDateTime(
  dateInput: Date | string | number | null | undefined,
  fallback = "-",
): string {
  const date = parseToDate(dateInput);
  if (!date) return fallback;

  try {
    return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return fallback;
  }
}
