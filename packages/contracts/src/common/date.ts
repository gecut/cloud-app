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

export const JALALI_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

export function toPersianDigits(n: number | string): string {
  const farsiDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(n).replace(/\d/g, (x) => farsiDigits[parseInt(x, 10)] ?? x);
}

export function isJalaliLeapYear(jy: number): boolean {
  const r = jy % 33;
  return [1, 5, 9, 13, 17, 22, 26, 30].includes(r);
}

export function getJalaliMonthDays(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

export function gregorianToJalali(dateInput: Date | string | number): {
  jy: number;
  jm: number;
  jd: number;
} {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  let gy = date.getFullYear();
  let gm = date.getMonth() + 1;
  let gd = date.getDate();

  const g_d_m = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let jy: number;
  if (gy > 1600) {
    jy = 979;
    gy -= 1600;
  } else {
    jy = 0;
    gy -= 621;
  }
  const gy2 = gm > 2 ? gy + 1 : gy;
  let days =
    365 * gy +
    Math.floor((gy2 + 3) / 4) -
    Math.floor((gy2 + 99) / 100) +
    Math.floor((gy2 + 399) / 400) -
    80 +
    gd;
  for (let i = 0; i < gm; ++i) days += (g_d_m[i] ?? 0);
  jy += 33 * Math.floor(days / 12053);
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = days < 186 ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + (days < 186 ? days % 31 : (days - 186) % 30);
  return { jy, jm, jd };
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  let gy: number;
  if (jy > 979) {
    gy = 1600;
    jy -= 979;
  } else {
    gy = 621;
  }
  let days =
    365 * jy +
    Math.floor(jy / 33) * 8 +
    Math.floor(((jy % 33) + 3) / 4) +
    78 +
    jd +
    (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_a = [
    0,
    31,
    (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  let gm = 0;
  for (gm = 0; gm < 13 && gd > (sal_a[gm] ?? 0); gm++) gd -= (sal_a[gm] ?? 0);
  return new Date(gy, gm - 1, gd, 12, 0, 0);
}
