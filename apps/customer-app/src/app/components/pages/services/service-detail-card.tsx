import { Button, ProgressBar } from "@heroui/react";
import { cn } from "@heroui/styles";

import { Service } from "@/app/data";

import { Link } from "@solar-icons/react-perf/category/text-formatting/LineDuotone";
import { ServerSquareCloud } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { ServerSquareCloudLineDuotone } from "@solar-icons/react-perf";
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

  // 1. بازه زمانی کلی یا دوره تعیین‌شده
  const rawCycle = Number(serviceDetail.billingCycle);
  const configuredCycleDays = !isNaN(rawCycle) && rawCycle > 0 ? rawCycle : null;
  const rawTotalDays = Math.round((renewalDate.getTime() - startDate.getTime()) / MS_PER_DAY);
  const totalDays = configuredCycleDays || Math.max(1, rawTotalDays);

  // 2. روزشمار معطوف به روزهای سپری‌شده
  const creationMs = serviceDetail.createdAt ? new Date(serviceDetail.createdAt).getTime() : startDate.getTime();
  const daysPassed = Math.max(0, Math.floor((Date.now() - creationMs) / MS_PER_DAY));
  const daysLeft = Math.max(0, totalDays - daysPassed);
  const remainingDaysPercent = Math.min(Math.max((daysLeft / totalDays) * 100, 0), 100);

  // 3. آلارم در صورت مغایرت دوره تعیین‌شده با بازه زمانی
  const isAlarmExceeded = trackingType !== "QUANTITY" && configuredCycleDays !== null && configuredCycleDays > totalDays;

  return (
    <div className="w-full">
      <div className="flex w-full flex-col gap-5 rounded-3xl bg-surface p-6 sm:p-7 border border-border/40 shadow-xs">
        <div className="flex w-full items-start justify-between">
          <div className="flex items-center gap-4">
            {showIcon &&
              (serviceDetail.type === "SERVICE" ? (
                <ServerSquareCloudLineDuotone
                  size={48}
                  className="*:stroke-1"
                />
              ) : null)}

            <div className="flex flex-col gap-2">
              <span className="leading-none text-md font-bold">
                {serviceDetail.name || serviceDetail.serviceType?.name || "سرویس ابری"}
              </span>

              <span className="text-xs leading-none text-muted-foreground">
                {serviceDetail.description || serviceDetail.serviceType?.name}
              </span>
            </div>
          </div>

          {serviceDetail.type === "SERVICE" ? (
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "w-1 h-2 rounded-full animate-wiggle delay-250",
                  statusStyle[serviceDetail.status],
                )}
              />
              <div
                className={cn(
                  "w-1 h-2 rounded-full animate-wiggle delay-450",
                  statusStyle[serviceDetail.status],
                )}
              />
              <div
                className={cn(
                  "w-1 h-2 rounded-full animate-wiggle delay-650",
                  statusStyle[serviceDetail.status],
                )}
              />
            </div>
          ) : serviceDetail.type === "DOMAIN" ? (
            <Link size={48} />
          ) : (
            <ServerSquareCloud size={48} />
          )}
        </div>

        {/* Alarm if cycle > span */}
        {isAlarmExceeded && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium">
            <svg className="h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>
              هشدار: دوره اسمی بسته ({configuredCycleDays?.toLocaleString("fa-IR")} روز) از بازه زمانی سررسید ({totalDays.toLocaleString("fa-IR")} روز) بیشتر است.
            </span>
          </div>
        )}

        {/* Days Left Progress (TIME & HYBRID) */}
        {showDays && (
          <div className="flex w-full flex-col gap-1 text-xs">
            <div className="flex items-center justify-between">
              <span>مدت زمان باقی‌مانده (روزشمار)</span>
              {daysLeft <= 0 ? (
                <span className="text-rose-500 font-medium">مهلت به پایان رسیده (نیاز به تمدید)</span>
              ) : (
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-medium text-foreground">{daysLeft.toLocaleString("fa-IR")} روز مانده</span>
                  <span className="text-muted-foreground text-[11px]">
                    ({Math.round(remainingDaysPercent).toLocaleString("fa-IR")}٪ از بازه {totalDays.toLocaleString("fa-IR")} روزه)
                  </span>
                </div>
              )}
            </div>
            <Progress progress={remainingDaysPercent} />
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

        <Button
          variant="primary"
          size="lg"
          className="w-full rounded-md font-light"
          onPress={() => {
            window.location.href = "/payments";
          }}
        >
          مدیریت و پرداخت صورت‌حساب
        </Button>
      </div>
    </div>
  );
}
