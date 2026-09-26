import { useState } from "react";
import { Service } from "@/app/data";
import { cn, Button } from "@heroui/react";
import { ServerSquareCloud } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { LayersMinimalistic } from "@solar-icons/react-perf/category/tools/BoldDuotone";
import { Progress } from "../../common/progress";
import { analyzeDateRange, analyzeServiceLifecycle } from "@gecut-cloud/contracts";
import { apiClient } from "@/lib/api-client";

interface DashboardCardProps {
  data: Service;
}

export function DashboardCard({ data }: DashboardCardProps) {
  const [isRenewing, setIsRenewing] = useState(false);

  const handleRenew = async () => {
    try {
      setIsRenewing(true);
      const res = await apiClient<{ success: boolean; invoice: any; message: string }>(
        `/services/${data.id}/renew`,
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

  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const startDate =
    data.purchaseDate instanceof Date
      ? data.purchaseDate
      : data.startDate instanceof Date
      ? data.startDate
      : new Date(data.purchaseDate || data.startDate || Date.now());

  const renewalDate =
    data.renewalDate instanceof Date
      ? data.renewalDate
      : new Date(data.renewalDate || (startDate.getTime() + 30 * MS_PER_DAY));

  const lifecycle = analyzeServiceLifecycle({
    trackingType: data.trackingType,
    startDate,
    renewalDate,
    billingCycle: data.billingCycle,
    quantity: data.quantity,
    usedQuantity: data.usedQuantity,
    status: data.status,
    paymentStatus: data.paymentStatus,
  });

  const trackingType = lifecycle.trackingType;
  const showDays = trackingType === "TIME" || trackingType === "HYBRID";
  const showQty = trackingType === "QUANTITY" || trackingType === "HYBRID";
  const isPackage = trackingType === "QUANTITY" || data.type === "PACKAGE";

  const totalQty = lifecycle.totalQty;
  const remainedQty = lifecycle.remainingQty;
  const quantityPercent = lifecycle.quantityPercent;

  // 1. تحلیل دقیق و استاندارد بازه زمانی
  const rawCycle = Number(data.billingCycle);
  const configuredCycleDays = !isNaN(rawCycle) && rawCycle > 0 ? rawCycle : null;

  const dateAnalysis = analyzeDateRange({
    startDate,
    endDate: renewalDate,
    configuredCycleDays,
  });

  const totalDays = lifecycle.totalDays;
  const daysLeft = lifecycle.daysLeft;
  const remainingDaysPercent = lifecycle.remainingPercent;
  const isExpired = lifecycle.isExpired;
  const isTimeExpired = lifecycle.isTimeExpired;
  const isAlarmExceeded = Boolean(dateAnalysis.isAlarmExceeded);
  const overdueDays = lifecycle.overdueDays;
  const isTimeNearExpiry = lifecycle.isTimeNearExpiry;

  const isQuantityDepleted = lifecycle.isQuantityDepleted;
  const isQuantityNearDepletion = lifecycle.isQuantityNearDepletion;

  const isServiceActive = lifecycle.isServiceActive;
  const displayStatus =
    data.paymentStatus === "UNPAID" || data.status === "SUSPENDED" || data.status === "INACTIVE" || !isServiceActive
      ? "SUSPENDED"
      : "ACTIVE";

  const statusStyle: Record<string, string> = {
    ACTIVE: "bg-green-400",
    INACTIVE: "bg-amber-400",
    SUSPENDED: "bg-amber-400",
  };

  return (
    <div className="flex flex-col w-full gap-3">
      <div className="flex flex-col gap-6 w-full p-6 sm:p-8 rounded-3xl bg-surface border border-border/40 shadow-xs">
        <div className="w-full flex items-start justify-between">
          <div className="flex items-center gap-4">
            {isPackage ? (
              <LayersMinimalistic size={50} className="*:stroke-1 text-amber-500" />
            ) : (
              <ServerSquareCloud size={50} className="*:stroke-1 text-primary" />
            )}

            <div className="flex flex-col justify-center gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="leading-none font-semibold text-md">
                  {data.name}
                </span>
                {data.serviceType?.name && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                    {data.serviceType.name}
                  </span>
                )}
              </div>

              <span className="text-xs font-normal leading-none text-muted-foreground">
                {data.description || (isPackage ? `بسته دارای ${totalQty.toLocaleString("fa-IR")} سهمیه فعال` : "سرویس فعال زیرساخت ابری")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {displayStatus === "SUSPENDED" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                معلق
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                فعال
              </span>
            )}

            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "w-1 h-2 rounded-full animate-wiggle delay-200",
                  statusStyle[displayStatus],
                )}
              />
              <div
                className={cn(
                  "w-1 h-2 rounded-full animate-wiggle delay-400",
                  statusStyle[displayStatus],
                )}
              />
              <div
                className={cn(
                  "w-1 h-2 rounded-full animate-wiggle delay-700",
                  statusStyle[displayStatus],
                )}
              />
            </div>
          </div>
        </div>

        <div className="w-full flex flex-col gap-3">
          {/* Days Remaining Progress (TIME & HYBRID) */}
          {showDays && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">مدت زمان باقی‌مانده</span>
                <div className="flex items-center gap-1 font-mono">
                  {isExpired ? (
                    <span className="font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <span>۰ روز مانده</span>
                      <span className="text-[10px] bg-rose-500/10 text-rose-600 dark:text-rose-400 px-1.5 py-0.5 rounded-md border border-rose-500/20">
                        (منقضی شده)
                      </span>
                    </span>
                  ) : (
                    <>
                      <span className={`font-semibold ${dateAnalysis.urgency === "critical" ? "text-rose-600 dark:text-rose-400" : dateAnalysis.urgency === "warning" ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                        {daysLeft.toLocaleString("fa-IR")} روز مانده
                      </span>
                      <span className="text-muted-foreground text-[11px]">
                        ({Math.round(remainingDaysPercent).toLocaleString("fa-IR")}٪ از بازه {totalDays.toLocaleString("fa-IR")} روزه)
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Explicit Error Banner when expired */}
              {isTimeExpired && !isQuantityDepleted && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-rose-600 dark:text-rose-400 font-bold">⚠️ خطا:</span>
                    <span>مهلت زمانی این سرویس به پایان رسیده است ({overdueDays.toLocaleString("fa-IR")} روز گذشته از موعد سررسید)</span>
                  </div>
                  <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded font-bold shrink-0">
                    نیاز به تمدید
                  </span>
                </div>
              )}

              {/* Critical Urgency Banner when near expiration (<= 3 days) */}
              {!isExpired && isTimeNearExpiry && (
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
                  <svg className="h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>هشدار: تنها {daysLeft.toLocaleString("fa-IR")} روز تا سررسید و پایان مهلت سرویس باقی مانده است. لطفاً نسبت به تمدید اقدام فرمایید.</span>
                </div>
              )}

              {/* Alarm for cycle mismatch */}
              {isAlarmExceeded && !isExpired && (
                <div className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-500/10 p-2 rounded-xl border border-amber-500/30 font-medium flex items-center gap-1">
                  <span>⚠️ هشدار: دوره تعیین‌شده ({configuredCycleDays?.toLocaleString("fa-IR")} روز) بیشتر از بازه زمانی سررسید ({totalDays.toLocaleString("fa-IR")} روز) است</span>
                </div>
              )}

              <Progress
                progress={remainingDaysPercent}
                variant={isExpired ? "rose" : isTimeNearExpiry ? "rose" : dateAnalysis.urgency === "warning" ? "amber" : "auto"}
              />
            </div>
          )}

          {/* Quantity Depleted Alarm */}
          {showQty && isQuantityDepleted && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <svg className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>خطا: سهمیه این سرویس به پایان رسیده است (۰ عدد باقی‌مانده). جهت شارژ مجدد تمدید فرمایید.</span>
            </div>
          )}

          {/* Quantity Near Depletion Alarm (<=5%) */}
          {showQty && isQuantityNearDepletion && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold animate-pulse">
              <svg className="h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>هشدار: کمتر از ۵٪ از سهمیه این سرویس باقی مانده است ({remainedQty.toLocaleString("fa-IR")} عدد باقی‌مانده).</span>
            </div>
          )}

          {/* Quantity Remaining Progress (QUANTITY & HYBRID) */}
          {showQty && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
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
              <Progress progress={quantityPercent} variant={isQuantityDepleted ? "rose" : isQuantityNearDepletion ? "amber" : "auto"} />
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-3 border-t border-border/40 mt-1">
            <span className="text-muted-foreground">
              {trackingType === "QUANTITY" ? "مبلغ بسته" : "هزینه دوره سرویس"}
            </span>
            <span className="font-semibold text-foreground font-mono">
              {Number(data.priceToman || 0) === 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">رایگان</span>
              ) : (
                <>
                  {Number(data.priceToman || 0).toLocaleString("fa-IR")}{" "}
                  <span className="text-[10px] text-muted-foreground font-normal">تومان</span>
                </>
              )}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-border/40">
            <Button
              variant={isExpired || isQuantityDepleted ? "danger" : "primary"}
              size="sm"
              className="w-full sm:flex-1 rounded-xl font-medium cursor-pointer text-xs py-2 px-3"
              isDisabled={isRenewing}
              onPress={handleRenew}
            >
              {isRenewing
                ? "در حال صدور فاکتور..."
                : isExpired || isQuantityDepleted
                ? "تمدید سرویس (صدور فوری فاکتور)"
                : "تمدید سرویس"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto rounded-xl font-medium cursor-pointer text-xs py-2 px-3 whitespace-nowrap"
              onPress={() => {
                window.location.href = "/payments";
              }}
            >
              صورت‌حساب‌ها
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
