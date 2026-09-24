import { useState } from "react";
import { Button, ProgressBar } from "@heroui/react";
import { cn } from "@heroui/styles";

import { Service } from "@/app/data";
import { apiClient } from "@/lib/api-client";
import { analyzeDateRange } from "@gecut-cloud/contracts";

import { Link } from "@solar-icons/react-perf/category/text-formatting/LineDuotone";
import { ServerSquareCloud, Server2 } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { ChatRoundDots } from "@solar-icons/react-perf/category/messages/BoldDuotone";
import { HeadphonesRound } from "@solar-icons/react-perf/category/devices/BoldDuotone";
import { GalleryWide } from "@solar-icons/react-perf/category/video/BoldDuotone";
import { ServerSquareCloudLineDuotone, Widget5Linear } from "@solar-icons/react-perf";
import { Table } from "./table";
import { Progress } from "../../common/progress";

interface ServiceDetailCardProps {
  serviceDetail: Service;
  showIcon?: boolean;
}

function formatCycleDays(cycle?: string | number, totalDays?: number) {
  const num = Number(cycle);
  if (!isNaN(num) && num > 0) {
    return `${num.toLocaleString("fa-IR")} روزه`;
  }
  if (totalDays && totalDays > 0) {
    return `${totalDays.toLocaleString("fa-IR")} روزه`;
  }
  return "۳۰ روزه";
}

export function ServiceDetailCard({
  serviceDetail,
  showIcon = true,
}: ServiceDetailCardProps) {
  const statusStyle: Record<Service["status"], string> = {
    ACTIVE: "bg-green-400",
    INACTIVE: "bg-red-400",
    SUSPENDED: "bg-yellow-400",
  };

  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const startDate =
    serviceDetail.purchaseDate instanceof Date
      ? serviceDetail.purchaseDate
      : serviceDetail.startDate instanceof Date
      ? serviceDetail.startDate
      : new Date(serviceDetail.purchaseDate || serviceDetail.startDate || Date.now());

  const renewalDate =
    serviceDetail.renewalDate instanceof Date
      ? serviceDetail.renewalDate
      : new Date(serviceDetail.renewalDate || (startDate.getTime() + 30 * MS_PER_DAY));

  const trackingType = (serviceDetail.trackingType || "HYBRID").toUpperCase();
  const showDays = trackingType === "TIME" || trackingType === "HYBRID";
  const showQty = trackingType === "QUANTITY" || trackingType === "HYBRID";

  const totalQty = serviceDetail.quantity || 1;
  const remainedQty = serviceDetail.remainedQuantity ?? Math.max(0, totalQty - (serviceDetail.usedQuantity || 0));
  const quantityPercent = Math.min(Math.max((remainedQty / totalQty) * 100, 0), 100);

  // تحلیل جامع و دقیق بازه زمانی با قرارداد یکپارچه سیستم
  const rawCycle = Number(serviceDetail.billingCycle);
  const configuredCycleDays = !isNaN(rawCycle) && rawCycle > 0 ? rawCycle : null;

  const dateAnalysis = analyzeDateRange({
    startDate,
    endDate: renewalDate,
    configuredCycleDays,
  });

  const totalDays = dateAnalysis.totalDays;
  const daysLeft = dateAnalysis.daysLeft;
  const remainingDaysPercent = dateAnalysis.remainingPercent;
  const isAlarmExceeded = trackingType !== "QUANTITY" && dateAnalysis.isAlarmExceeded;
  const isExpired = trackingType !== "QUANTITY" && dateAnalysis.isExpired;
  const overdueDays = dateAnalysis.overdueDays;
  const isTimeNearExpiry = trackingType !== "QUANTITY" && !isExpired && daysLeft > 0 && daysLeft <= 3;
  const isCritical = isTimeNearExpiry;

  const isQuantityDepleted = (trackingType === "QUANTITY" || trackingType === "HYBRID") && (remainedQty <= 0 || (serviceDetail.usedQuantity || 0) >= totalQty);
  const isQuantityNearDepletion = (trackingType === "QUANTITY" || trackingType === "HYBRID") && !isQuantityDepleted && (quantityPercent <= 5 || remainedQty <= Math.max(1, Math.ceil(totalQty * 0.05)));

  const isServiceActive = !isExpired && remainedQty > 0 ? true : serviceDetail.status === "ACTIVE";
  const displayStatus =
    serviceDetail.paymentStatus === "UNPAID" || serviceDetail.status === "SUSPENDED"
      ? "SUSPENDED"
      : isServiceActive
      ? "ACTIVE"
      : "INACTIVE";

  const [isRenewing, setIsRenewing] = useState(false);
  const [autoRenew, setAutoRenew] = useState(Boolean((serviceDetail as any).autoRenew));
  const [isTogglingAutoRenew, setIsTogglingAutoRenew] = useState(false);

  const handleToggleAutoRenew = async () => {
    try {
      setIsTogglingAutoRenew(true);
      const next = !autoRenew;
      await apiClient(`/services/${serviceDetail.id}`, {
        method: "PATCH",
        body: JSON.stringify({ autoRenew: next }),
      });
      setAutoRenew(next);
    } catch {
      // ignore
    } finally {
      setIsTogglingAutoRenew(false);
    }
  };

  const handleRenew = async () => {
    try {
      setIsRenewing(true);
      const res = await apiClient<{ success: boolean; invoice: any; message: string }>(
        `/services/${serviceDetail.id}/renew`,
        { method: "POST" },
      );
      if (res?.invoice) {
        window.location.href = "/payments";
      }
    } catch (err: any) {
      alert(err.message || "خطا در صدور فاکتور تمدید سرویس");
    } finally {
      setIsRenewing(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex w-full flex-col gap-5 rounded-3xl bg-surface p-6 sm:p-7 border border-border/40 shadow-xs">
        <div className="flex w-full items-start justify-between">
          <div className="flex items-center gap-4">
            {showIcon && (() => {
              const slug = (serviceDetail.serviceType?.slug || serviceDetail.type || "").toLowerCase();
              const name = (serviceDetail.serviceType?.name || serviceDetail.name || "").toLowerCase();
              if (slug.includes("domain") || name.includes("دامنه")) {
                return <Link size={48} className="text-blue-500" />;
              }
              if (slug.includes("server") || name.includes("سرور")) {
                return <Server2 size={48} className="text-emerald-500" />;
              }
              if (slug.includes("sms") || name.includes("پیامک")) {
                return <ChatRoundDots size={48} className="text-amber-500" />;
              }
              if (slug.includes("support") || name.includes("پشتیبانی")) {
                return <HeadphonesRound size={48} className="text-cyan-500" />;
              }
              if (slug.includes("image") || name.includes("تصویر") || name.includes("عکس")) {
                return <GalleryWide size={48} className="text-pink-500" />;
              }
              if (slug.includes("host") || name.includes("هاست") || name.includes("میزبانی")) {
                return <ServerSquareCloud size={48} className="text-sky-500" />;
              }
              if (slug.includes("api") || name.includes("وب‌سرویس")) {
                return <ServerSquareCloudLineDuotone size={48} className="*:stroke-1 text-indigo-500" />;
              }
              return <Widget5Linear size={48} className="*:stroke-1 text-purple-500" />;
            })()}

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="leading-none text-md font-bold">
                  {serviceDetail.name}
                </span>
                {serviceDetail.serviceType?.name && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                    {serviceDetail.serviceType.name}
                  </span>
                )}
              </div>

              {serviceDetail.description && (
                <span className="text-xs leading-none text-muted-foreground font-medium">
                  {serviceDetail.description}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {displayStatus === "SUSPENDED" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                معلق
              </span>
            ) : displayStatus === "INACTIVE" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                غیرفعال
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                پرداخت شده
              </span>
            )}

            {displayStatus === "ACTIVE" && (
              <div className="flex items-center gap-1">
                <div
                  className={cn(
                    "w-1 h-2 rounded-full animate-wiggle delay-250",
                    statusStyle[displayStatus],
                  )}
                />
                <div
                  className={cn(
                    "w-1 h-2 rounded-full animate-wiggle delay-450",
                    statusStyle[displayStatus],
                  )}
                />
                <div
                  className={cn(
                    "w-1 h-2 rounded-full animate-wiggle delay-650",
                    statusStyle[displayStatus],
                  )}
                />
              </div>
            )}
          </div>
        </div>

        {/* Overdue/Expired Alarm Banner */}
        {showDays && isExpired && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
            <svg className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div className="flex flex-col gap-0.5">
              <span className="font-semibold text-rose-800 dark:text-rose-200">
                ⚠️ خطا: مهلت زمانی این سرویس به پایان رسیده است
              </span>
              <span className="text-[11px] opacity-90">
                تاریخ سررسید سرویس گذشته است ({overdueDays.toLocaleString("fa-IR")} روز گذشته). لطفاً جهت استمرار خدمات، سریعاً نسبت به تمدید اقدام نمایید.
              </span>
            </div>
          </div>
        )}

        {/* Critical Alarm (<=3 days left and not expired) */}
        {showDays && isCritical && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold animate-pulse">
            <svg className="h-4 w-4 shrink-0 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              هشدار: تنها {daysLeft.toLocaleString("fa-IR")} روز تا پایان مهلت سرویس باقی مانده است. لطفاً نسبت به تمدید اقدام نمایید.
            </span>
          </div>
        )}

        {/* Quantity Depleted Alarm */}
        {showQty && isQuantityDepleted && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            <svg className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>
              خطا: سهمیه این سرویس به پایان رسیده است (۰ عدد باقی‌مانده). جهت شارژ مجدد، سرویس را تمدید فرمایید.
            </span>
          </div>
        )}

        {/* Quantity Near Depletion Alarm (<=5%) */}
        {showQty && isQuantityNearDepletion && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold animate-pulse">
            <svg className="h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              هشدار: کمتر از ۵٪ از سهمیه این سرویس باقی مانده است ({remainedQty.toLocaleString("fa-IR")} عدد مانده). لطفاً نسبت به تمدید اقدام فرمایید.
            </span>
          </div>
        )}

        {/* Alarm if cycle > span */}
        {isAlarmExceeded && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
            <svg className="h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              {dateAnalysis.alarmMessage || `هشدار: دوره اسمی بسته (${configuredCycleDays?.toLocaleString("fa-IR")} روز) از بازه زمانی سررسید (${totalDays.toLocaleString("fa-IR")} روز) بیشتر است.`}
            </span>
          </div>
        )}

        {/* Days Left Progress (TIME & HYBRID) */}
        {showDays && (
          <div className="flex w-full flex-col gap-1 text-xs">
            <div className="flex items-center justify-between">
              <span>مدت زمان باقی‌مانده (روزشمار)</span>
              {isExpired ? (
                <span className="text-rose-600 font-bold">
                  ۰ روز مانده (منقضی شده - {overdueDays.toLocaleString("fa-IR")} روز معوقه)
                </span>
              ) : (
                <div className="flex items-center gap-1 font-mono">
                  <span className={cn("font-medium", isCritical ? "text-amber-600 font-bold" : "text-foreground")}>
                    {daysLeft.toLocaleString("fa-IR")} روز مانده
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    ({Math.round(remainingDaysPercent).toLocaleString("fa-IR")}٪ از بازه {totalDays.toLocaleString("fa-IR")} روزه)
                  </span>
                </div>
              )}
            </div>
            <Progress
              progress={isExpired ? 0 : remainingDaysPercent}
              variant={isExpired ? "rose" : isCritical ? "amber" : "auto"}
            />
          </div>
        )}

        {/* Quantity Remaining Progress (QUANTITY & HYBRID) */}
        {showQty && (
          <div className="flex w-full flex-col gap-1 text-xs">
            <div className="flex items-center justify-between">
              <span>سهمیه / باقی‌مانده بسته</span>
              <div className="flex items-center gap-1 font-mono">
                <span className="font-semibold text-foreground">
                  {remainedQty.toLocaleString("fa-IR")} از {totalQty.toLocaleString("fa-IR")} عدد
                </span>
                <span className="text-muted-foreground text-[11px]">
                  ({Math.round(quantityPercent).toLocaleString("fa-IR")}٪ باقی‌مانده)
                </span>
              </div>
            </div>
            <Progress progress={quantityPercent} />
          </div>
        )}

        {/* Auto-renew switch */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-secondary/60 border border-border/30 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-foreground">تمدید خودکار این سرویس</span>
            <span className="text-[11px] text-muted-foreground">
              صدور و تکرار خودکار صورت‌حساب در موعد سررسید
            </span>
          </div>
          {/* <button
            type="button"
            disabled={isTogglingAutoRenew}
            onClick={handleToggleAutoRenew}
            className={`cursor-pointer px-3 py-1 rounded-xl text-xs font-semibold transition-colors ${
              autoRenew
                ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                : "bg-muted text-muted-foreground border border-border/40"
            }`}
          >
            {autoRenew ? "فعال است ✓" : "غیرفعال"}
          </button> */}
        </div>

        <Table
          data={{
            Date: trackingType === "QUANTITY" ? "بدون انقضای زمانی" : renewalDate,
            startDate: trackingType === "QUANTITY" ? undefined : startDate,
            spanDays: trackingType === "QUANTITY" ? undefined : totalDays,
            daysLeft: trackingType === "QUANTITY" ? undefined : daysLeft,
            cycle:
              trackingType === "QUANTITY"
                ? "شارژ مصرفی / بسته اعتباری"
                : formatCycleDays(serviceDetail.billingCycle, totalDays),
            price: serviceDetail.priceToman,
          }}
        />

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1 w-full">
          <Button
            variant={isExpired ? "danger" : "primary"}
            size="md"
            className="w-full sm:flex-1 rounded-xl font-medium cursor-pointer text-xs sm:text-sm py-2.5 px-3 min-w-0"
            isDisabled={isRenewing}
            onPress={handleRenew}
          >
            {isRenewing
              ? "در حال صدور فاکتور تمدید..."
              : isExpired
              ? "تمدید سرویس  "
              : "تمدید سرویس"}
          </Button>

          <Button
            variant="outline"
            size="md"
            className="w-full sm:w-auto rounded-xl font-medium cursor-pointer text-xs sm:text-sm py-2.5 px-4 shrink-0 whitespace-nowrap"
            onPress={() => {
              window.location.href = "/payments";
            }}
          >
            مشاهده صورت‌حساب‌ها
          </Button>
        </div>
      </div>
    </div>
  );
}
