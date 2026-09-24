import { useState } from "react";
import { Subscription } from "@/app/data";
import { ProgressCircle } from "@heroui/react";
import { Button } from "@heroui/react/button";
import { LayersMinimalistic } from "@solar-icons/react-perf/category/tools/BoldDuotone";
import { Table } from "./_table";
import { Progress } from "@/app/components/common/progress";
import { formatJalaliDate, analyzeDateRange } from "@gecut-cloud/contracts";
import { apiClient } from "@/lib/api-client";

interface SubscriptionCardProps {
  data: Subscription;
}

export function SubscriptionCard({ data }: SubscriptionCardProps) {
  const [isRenewing, setIsRenewing] = useState(false);
  const [autoRenew, setAutoRenew] = useState(Boolean((data as any).autoRenew));
  const [isTogglingAutoRenew, setIsTogglingAutoRenew] = useState(false);

  const handleToggleAutoRenew = async () => {
    try {
      setIsTogglingAutoRenew(true);
      const next = !autoRenew;
      await apiClient(`/services/${data.id}`, {
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
        `/services/${data.id}/renew`,
        { method: "POST" },
      );
      if (res?.invoice) {
        window.location.href = "/payments";
      }
    } catch (err: any) {
      alert(err.message || "خطا در صدور فاکتور تمدید");
    } finally {
      setIsRenewing(false);
    }
  };
  const total = Number(data?.totalVolume) || 1;
  const remained = Number(data?.remainedVolume) ?? total;
  const remainPercent = Math.min(Math.max(Math.round((remained / total) * 100), 0), 100);

  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const startDate =
    data.purchaseDate instanceof Date
      ? data.purchaseDate
      : data.startDate instanceof Date
      ? data.startDate
      : data.buyData instanceof Date
      ? data.buyData
      : new Date(data.purchaseDate || data.startDate || data.buyData || Date.now());

  const renewalDate =
    data.renewalDate instanceof Date
      ? data.renewalDate
      : data.renewalDate
      ? new Date(data.renewalDate)
      : null;

  const trackingType = (data.trackingType || "HYBRID").toUpperCase();
  const isHybrid = trackingType === "HYBRID" || (trackingType !== "QUANTITY" && !!renewalDate);

  // محاسبه بازه زمانی و روزهای باقی‌مانده با متد استاندارد
  const rawCycle = Number(data.billingCycle);
  const configuredCycleDays = !isNaN(rawCycle) && rawCycle > 0 ? rawCycle : null;

  const dateAnalysis = analyzeDateRange({
    startDate,
    endDate: renewalDate,
    configuredCycleDays,
  });

  const totalDays = dateAnalysis.totalSpanDays;
  const daysLeft = dateAnalysis.daysLeft;
  const remainingDaysPercent = dateAnalysis.remainingPercent;
  const isExpired = dateAnalysis.isExpired;
  const overdueDays = dateAnalysis.overdueDays;

  const isQuantityDepleted = remained <= 0;
  const isQuantityNearDepletion = !isQuantityDepleted && (remainPercent <= 5 || remained <= Math.max(1, Math.ceil(total * 0.05)));
  const isTimeNearExpiry = isHybrid && !isExpired && daysLeft > 0 && daysLeft <= 3;

  return (
    <div className="w-full flex flex-col items-stretch gap-5 bg-surface rounded-3xl p-6 sm:p-7 border border-border/40 shadow-xs">
      <div className="w-full flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="text-base sm:text-lg font-bold text-foreground">{data.title}</span>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{data.subTitle}</span>
        </div>

        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
          <LayersMinimalistic size={32} />
        </div>
      </div>

      <div className="w-full bg-surface-secondary/70 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-5 border border-border/30">
        <div className="w-full sm:flex-1">
          <Table
            data={{
              date: data.buyData,
              price: data.price,
              totalVolume: total,
            }}
          />
        </div>

        <div className="flex flex-col items-center justify-center gap-2 px-3 py-1 shrink-0">
          <ProgressCircle aria-label="باقی‌مانده بسته" value={remainPercent} className="text-amber-500">
            <ProgressCircle.Track className="size-16 sm:size-18">
              <ProgressCircle.TrackCircle />
              <ProgressCircle.FillCircle />
            </ProgressCircle.Track>

            <span className="absolute z-10 text-xs sm:text-sm font-bold font-mono">
              {remainPercent.toLocaleString("fa-IR")}%
            </span>
          </ProgressCircle>

          <label className="text-[11px] sm:text-xs whitespace-nowrap font-medium text-muted-foreground font-mono">
            {remained.toLocaleString("fa-IR")} عدد مانده
          </label>
        </div>
      </div>

      {/* نمایش خطا در صورت اتمام سهمیه عددی بسته */}
      {isQuantityDepleted && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          <svg className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            خطا: سهمیه این بسته به پایان رسیده است (۰ عدد باقی‌مانده). جهت شارژ مجدد، بسته را تمدید فرمایید.
          </span>
        </div>
      )}

      {/* نمایش هشدار ۵ درصد مانده به پایان سهمیه بسته */}
      {isQuantityNearDepletion && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold animate-pulse">
          <svg className="h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>
            هشدار: کمتر از ۵٪ از سهمیه این بسته باقی مانده است ({remained.toLocaleString("fa-IR")} عدد مانده). لطفاً نسبت به تمدید اقدام فرمایید.
          </span>
        </div>
      )}

      {/* نمایش هشدار ۳ روز مانده به پایان اعتبار زمانی */}
      {isTimeNearExpiry && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold animate-pulse">
          <svg className="h-4 w-4 shrink-0 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            هشدار: تنها {daysLeft.toLocaleString("fa-IR")} روز تا پایان مهلت این بسته باقی مانده است. لطفاً نسبت به تمدید اقدام فرمایید.
          </span>
        </div>
      )}

      {/* نمایش هشدار انقضا در صورت اتمام تاریخ سررسید */}
      {isExpired && (
        <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold">
          <svg className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            هشدار: مهلت این سرویس به پایان رسیده است ({overdueDays.toLocaleString("fa-IR")} روز معوقه)! جهت ادامه ارائه خدمات، نسبت به تمدید اقدام فرمایید.
          </span>
        </div>
      )}

      {/* نمایش نوار پیشرفت خطی زمان برای سرویس‌های ترکیبی (هم تعداد و هم زمان) */}
      {isHybrid && (
        <div className="w-full flex flex-col gap-2.5 pt-2 px-1">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
              <svg
                className="w-3.5 h-3.5 text-amber-500 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>اعتبار زمانی سرویس</span>
            </div>

            {isExpired ? (
              <span className="text-rose-600 dark:text-rose-400 font-bold text-[11px] bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                ۰ روز مانده (منقضی شده - {overdueDays.toLocaleString("fa-IR")} روز گذشته)
              </span>
            ) : (
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className={`font-semibold ${dateAnalysis.urgency === "critical" ? "text-rose-600" : dateAnalysis.urgency === "warning" ? "text-amber-600" : "text-foreground"}`}>
                  {daysLeft.toLocaleString("fa-IR")} روز مانده
                </span>
                <span className="text-muted-foreground text-[10px]">
                  ({Math.round(remainingDaysPercent).toLocaleString("fa-IR")}٪
                  {renewalDate ? ` - تا ${formatJalaliDate(renewalDate)}` : ` از دوره ${totalDays.toLocaleString("fa-IR")} روزه`})
                </span>
              </div>
            )}
          </div>

          <Progress
            progress={isExpired ? 0 : remainingDaysPercent}
            variant={isExpired ? "rose" : daysLeft <= 7 ? "rose" : "amber"}
            className="h-2"
          />
        </div>
      )}

      {/* Auto-renew switch */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-surface-secondary/60 border border-border/30 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-foreground">تمدید خودکار این بسته</span>
          <span className="text-[11px] text-muted-foreground">
            صدور خودکار صورت‌حساب در موعد سررسید
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
            ? "تمدید بسته (صدور فوری فاکتور)"
            : "تمدید زودهنگام بسته"}
        </Button>

        <Button
          variant="outline"
          size="md"
          className="w-full sm:w-auto rounded-xl font-medium cursor-pointer text-xs sm:text-sm py-2.5 px-4 shrink-0 whitespace-nowrap"
          onPress={() => {
            window.location.href = "/payments";
          }}
        >
          صورت‌حساب‌ها
        </Button>
      </div>
    </div>
  );
}
