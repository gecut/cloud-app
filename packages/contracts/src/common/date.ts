export function parseToDate(dateInput: Date | string | number | null | undefined): Date | null {
  if (!dateInput) return null;
  if (typeof dateInput === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const parts = dateInput.split("-").map(Number);
    const y = parts[0] ?? 2026;
    const m = parts[1] ?? 1;
    const d = parts[2] ?? 1;
    return new Date(y, m - 1, d, 12, 0, 0);
  }
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
  const date = parseToDate(dateInput) || new Date();
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

export interface DateRangeAnalysis {
  isValid: boolean;
  isNegativeRange: boolean;
  errorMessage?: string;
  startDate: Date;
  endDate: Date;
  totalSpanDays: number;
  totalDays: number;
  daysPassed: number;
  daysLeft: number;
  remainingPercent: number;
  isExpired: boolean;
  isOverdue: boolean;
  overdueDays: number;
  isFuture: boolean;
  urgency: "expired" | "critical" | "warning" | "normal";
  statusText: string;
  isAlarmExceeded?: boolean;
  alarmMessage?: string;
}

/**
 * Complete analysis of a date range (start to renewal/end date).
 * Ensures that if the date passes, remaining days is strictly 0,
 * progress is 0%, and an explicit error/warning is triggered.
 */
export function analyzeDateRange(params: {
  startDate: Date | string | number | null | undefined;
  endDate: Date | string | number | null | undefined;
  configuredCycleDays?: number | null;
  nowDate?: Date;
}): DateRangeAnalysis {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const now = params.nowDate || new Date();

  const start = parseToDate(params.startDate) || now;
  const end = parseToDate(params.endDate) || new Date(start.getTime() + 30 * MS_PER_DAY);

  const startMs = start.getTime();
  const endMs = end.getTime();
  const nowMs = now.getTime();

  // 1. Validation: End before Start (Negative Range Error)
  if (endMs < startMs) {
    const negativeDays = Math.ceil((startMs - endMs) / MS_PER_DAY);
    return {
      isValid: false,
      isNegativeRange: true,
      errorMessage: "تاریخ سررسید نمی‌تواند قبل از تاریخ خرید باشد",
      startDate: start,
      endDate: end,
      totalSpanDays: 0,
      totalDays: 0,
      daysPassed: 0,
      daysLeft: 0,
      remainingPercent: 0,
      isExpired: true,
      isOverdue: true,
      overdueDays: negativeDays,
      isFuture: false,
      urgency: "expired",
      statusText: "بازه نامعتبر (سررسید قبل از خرید)",
    };
  }

  const rawSpanDays = Math.round((endMs - startMs) / MS_PER_DAY);
  const totalSpanDays = Math.max(1, rawSpanDays);

  const configuredCycleDays =
    params.configuredCycleDays && params.configuredCycleDays > 0
      ? Number(params.configuredCycleDays)
      : null;

  const effectiveSpanDays = configuredCycleDays || totalSpanDays;

  // 2. Alarm: Configured cycle exceeds calendar span
  const isAlarmExceeded =
    configuredCycleDays !== null && totalSpanDays > 0 && configuredCycleDays > totalSpanDays;
  const alarmMessage = isAlarmExceeded
    ? `دوره تعیین‌شده (${configuredCycleDays.toLocaleString("fa-IR")} روز) بیشتر از بازه زمانی سررسید (${totalSpanDays.toLocaleString("fa-IR")} روز) است`
    : undefined;

  // 3. Case A: Future (now < start)
  if (nowMs < startMs) {
    return {
      isValid: true,
      isNegativeRange: false,
      startDate: start,
      endDate: end,
      totalSpanDays: effectiveSpanDays,
      totalDays: effectiveSpanDays,
      daysPassed: 0,
      daysLeft: effectiveSpanDays,
      remainingPercent: 100,
      isExpired: false,
      isOverdue: false,
      overdueDays: 0,
      isFuture: true,
      urgency: "normal",
      statusText: "آینده (هنوز آغاز نشده)",
      isAlarmExceeded,
      alarmMessage,
    };
  }

  // 4. Case B: Expired / Overdue (now >= end)
  if (nowMs >= endMs) {
    const overdueDays = Math.max(1, Math.floor((nowMs - endMs) / MS_PER_DAY));
    return {
      isValid: true,
      isNegativeRange: false,
      errorMessage: `مهلت این سرویس/سررسید به پایان رسیده است (${overdueDays.toLocaleString("fa-IR")} روز گذشته از سررسید)`,
      startDate: start,
      endDate: end,
      totalSpanDays: effectiveSpanDays,
      totalDays: effectiveSpanDays,
      daysPassed: effectiveSpanDays,
      daysLeft: 0,
      remainingPercent: 0,
      isExpired: true,
      isOverdue: true,
      overdueDays,
      isFuture: false,
      urgency: "expired",
      statusText: `منقضی شده (${overdueDays.toLocaleString("fa-IR")} روز گذشته)`,
      isAlarmExceeded,
      alarmMessage,
    };
  }

  // 5. Case C: Active (start <= now < end)
  const msRemaining = endMs - nowMs;
  const daysLeft = Math.max(0, Math.ceil(msRemaining / MS_PER_DAY));
  const daysPassed = Math.max(0, effectiveSpanDays - daysLeft);
  const remainingPercent = Math.min(100, Math.max(0, (daysLeft / effectiveSpanDays) * 100));

  if (daysLeft <= 0) {
    const overdueDays = Math.max(1, Math.floor((nowMs - endMs) / MS_PER_DAY));
    return {
      isValid: true,
      isNegativeRange: false,
      errorMessage: `مهلت این سرویس/سررسید به پایان رسیده است (${overdueDays.toLocaleString("fa-IR")} روز گذشته از سررسید)`,
      startDate: start,
      endDate: end,
      totalSpanDays: effectiveSpanDays,
      totalDays: effectiveSpanDays,
      daysPassed: effectiveSpanDays,
      daysLeft: 0,
      remainingPercent: 0,
      isExpired: true,
      isOverdue: true,
      overdueDays,
      isFuture: false,
      urgency: "expired",
      statusText: `منقضی شده (${overdueDays.toLocaleString("fa-IR")} روز گذشته)`,
      isAlarmExceeded,
      alarmMessage,
    };
  }

  let urgency: "expired" | "critical" | "warning" | "normal" = "normal";
  let statusText = `${daysLeft.toLocaleString("fa-IR")} روز باقی‌مانده`;
  if (daysLeft <= 3) {
    urgency = "critical";
    statusText = `بحرانی (تنها ${daysLeft.toLocaleString("fa-IR")} روز مانده)`;
  } else if (daysLeft <= 7) {
    urgency = "warning";
    statusText = `نزدیک سررسید (${daysLeft.toLocaleString("fa-IR")} روز مانده)`;
  }

  return {
    isValid: true,
    isNegativeRange: false,
    startDate: start,
    endDate: end,
    totalSpanDays: effectiveSpanDays,
    totalDays: effectiveSpanDays,
    daysPassed,
    daysLeft,
    remainingPercent,
    isExpired: false,
    isOverdue: false,
    overdueDays: 0,
    isFuture: false,
    urgency,
    statusText,
    isAlarmExceeded,
    alarmMessage,
  };
}

export interface JalaliMonthPeriod {
  offset: number;
  year: number;
  month: number;
  monthName: string;
  shortLabel: string;
  label: string;
  startDate: Date;
  endDate: Date;
}

/**
 * Returns dynamic Jalali month periods (current month, past months)
 * calculated purely using the Persian calendar.
 */
export function getJalaliMonthPeriods(count = 12, baseDate?: Date): JalaliMonthPeriod[] {
  const now = baseDate || new Date();
  const currentJalali = gregorianToJalali(now);
  const periods: JalaliMonthPeriod[] = [];

  for (let i = 0; i < count; i++) {
    let targetYear = currentJalali.jy;
    let targetMonth = currentJalali.jm - i;
    while (targetMonth < 1) {
      targetMonth += 12;
      targetYear -= 1;
    }

    const monthName = JALALI_MONTH_NAMES[targetMonth - 1] ?? "";
    const daysInMonth = getJalaliMonthDays(targetYear, targetMonth);
    const startDate = jalaliToGregorian(targetYear, targetMonth, 1);
    startDate.setHours(0, 0, 0, 0);
    const endDate = jalaliToGregorian(targetYear, targetMonth, daysInMonth);
    endDate.setHours(23, 59, 59, 999);

    const shortLabel = `${toPersianDigits(targetYear)} ${monthName}`;
    const label = i === 0 ? `ماه جاری (${shortLabel})` : `${toPersianDigits(i)} ماه قبل (${shortLabel})`;

    periods.push({
      offset: i,
      year: targetYear,
      month: targetMonth,
      monthName,
      shortLabel,
      label,
      startDate,
      endDate,
    });
  }

  return periods;
}

export interface ServiceLifecycleAnalysis {
  trackingType: "TIME" | "QUANTITY" | "HYBRID";
  isExpired: boolean;
  isTimeExpired: boolean;
  isQuantityDepleted: boolean;
  isTimeNearExpiry: boolean;
  isQuantityNearDepletion: boolean;
  hasWarning: boolean;
  warningMessage?: string;
  expiredReason?: string;
  daysLeft: number;
  totalDays: number;
  overdueDays: number;
  remainingPercent: number;
  totalQty: number;
  usedQty: number;
  remainingQty: number;
  quantityPercent: number;
  isServiceActive: boolean;
  displayStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

/**
 * Complete lifecycle and warning analysis for services (TIME, QUANTITY, HYBRID).
 * Strictly applies the business rule: In HYBRID packages, quantity depletion takes precedence
 * and expires the service immediately if exhausted before time.
 */
export function analyzeServiceLifecycle(params: {
  trackingType?: string | null;
  startDate?: Date | string | number | null;
  renewalDate?: Date | string | number | null;
  billingCycle?: string | number | null;
  quantity?: number | null;
  usedQuantity?: number | null;
  status?: string | null;
  paymentStatus?: string | null;
  nowDate?: Date;
}): ServiceLifecycleAnalysis {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const now = params.nowDate || new Date();
  const rawType = (params.trackingType || "HYBRID").toUpperCase();
  const trackingType: "TIME" | "QUANTITY" | "HYBRID" =
    rawType === "TIME" || rawType === "QUANTITY" ? rawType : "HYBRID";

  // 1. Quantity analysis
  const totalQty = Math.max(1, Number(params.quantity) || 1);
  const usedQty = Math.max(0, Number(params.usedQuantity) || 0);
  const remainingQty = Math.max(0, totalQty - usedQty);
  const quantityPercent = Math.min(Math.max((remainingQty / totalQty) * 100, 0), 100);

  const isQuantityDepleted =
    (trackingType === "QUANTITY" || trackingType === "HYBRID") &&
    (remainingQty <= 0 || usedQty >= totalQty);

  const isQuantityNearDepletion =
    (trackingType === "QUANTITY" || trackingType === "HYBRID") &&
    !isQuantityDepleted &&
    (quantityPercent <= 5 || remainingQty <= Math.max(1, Math.ceil(totalQty * 0.05)));

  // 2. Date & Time analysis
  const rawCycle = Number(params.billingCycle);
  const configuredCycleDays = !isNaN(rawCycle) && rawCycle > 0 ? rawCycle : null;

  const start = parseToDate(params.startDate) || now;
  const end = parseToDate(params.renewalDate) || new Date(start.getTime() + (configuredCycleDays || 30) * MS_PER_DAY);

  const dateAnalysis = analyzeDateRange({
    startDate: start,
    endDate: end,
    configuredCycleDays,
    nowDate: now,
  });

  const isTimeExpired = trackingType !== "QUANTITY" && dateAnalysis.isExpired;
  const isTimeNearExpiry =
    trackingType !== "QUANTITY" &&
    !isTimeExpired &&
    dateAnalysis.daysLeft > 0 &&
    dateAnalysis.daysLeft <= 3;

  // 3. Expiration logic with priority
  // Rule: For HYBRID packages, priority is on quantity: if quantity ends first, service is expired!
  let isExpired = false;
  let expiredReason: string | undefined;

  if (trackingType === "QUANTITY") {
    isExpired = isQuantityDepleted;
    if (isExpired) {
      expiredReason = "سقف سهمیه بسته به پایان رسیده است";
    }
  } else if (trackingType === "TIME") {
    isExpired = isTimeExpired;
    if (isExpired) {
      expiredReason = `موعد سررسید ${dateAnalysis.overdueDays.toLocaleString("fa-IR")} روز پیش منقضی شده است`;
    }
  } else {
    // HYBRID: Priority to quantity depletion
    if (isQuantityDepleted) {
      isExpired = true;
      expiredReason = "سهمیه بسته به پایان رسیده است";
    } else if (isTimeExpired) {
      isExpired = true;
      expiredReason = `مهلت زمانی سرویس به پایان رسیده است (${dateAnalysis.overdueDays.toLocaleString("fa-IR")} روز گذشته)`;
    }
  }

  // 4. Warning logic
  const hasWarning = !isExpired && (isQuantityNearDepletion || isTimeNearExpiry);
  let warningMessage: string | undefined;
  if (hasWarning) {
    if (isQuantityNearDepletion && isTimeNearExpiry) {
      warningMessage = `هشدار: کمتر از ۵٪ سهمیه (${toPersianDigits(remainingQty)} عدد) و تنها ${toPersianDigits(dateAnalysis.daysLeft)} روز تا سررسید باقی است`;
    } else if (isQuantityNearDepletion) {
      warningMessage = `هشدار: کمتر از ۵٪ از سهمیه بسته باقی مانده است (${toPersianDigits(remainingQty)} عدد باقی‌مانده)`;
    } else if (isTimeNearExpiry) {
      warningMessage = `هشدار: تنها ${toPersianDigits(dateAnalysis.daysLeft)} روز تا پایان مهلت سرویس باقی مانده است`;
    }
  }

  // 5. Active state calculation
  const isDbActive = params.status === "ACTIVE";
  const isServiceActive = !isExpired && isDbActive;

  let displayStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED" = "ACTIVE";
  if (params.paymentStatus === "UNPAID" || params.status === "SUSPENDED") {
    displayStatus = "SUSPENDED";
  } else if (isExpired || params.status === "INACTIVE" || !isServiceActive) {
    displayStatus = "INACTIVE";
  } else {
    displayStatus = "ACTIVE";
  }

  return {
    trackingType,
    isExpired,
    isTimeExpired,
    isQuantityDepleted,
    isTimeNearExpiry,
    isQuantityNearDepletion,
    hasWarning,
    warningMessage,
    expiredReason,
    daysLeft: dateAnalysis.daysLeft,
    totalDays: dateAnalysis.totalDays,
    overdueDays: dateAnalysis.overdueDays,
    remainingPercent: dateAnalysis.remainingPercent,
    totalQty,
    usedQty,
    remainingQty,
    quantityPercent,
    isServiceActive,
    displayStatus,
  };
}


