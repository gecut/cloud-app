import { Subscription } from "@/app/data";
import { ProgressCircle } from "@heroui/react";
import { LayersMinimalistic } from "@solar-icons/react-perf/category/tools/BoldDuotone";
import { Table } from "./_table";
import { Progress } from "@/app/components/common/progress";
import { formatJalaliDate } from "@gecut-cloud/contracts";

interface SubscriptionCardProps {
  data: Subscription;
}

export function SubscriptionCard({ data }: SubscriptionCardProps) {
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

  // محاسبه بازه زمانی و روزهای باقی‌مانده
  const rawCycle = Number(data.billingCycle);
  const configuredCycleDays = !isNaN(rawCycle) && rawCycle > 0 ? rawCycle : null;
  const rawTotalDays = renewalDate
    ? Math.max(1, Math.round((renewalDate.getTime() - startDate.getTime()) / MS_PER_DAY))
    : 30;
  const totalDays = configuredCycleDays || rawTotalDays;

  const creationMs = data.createdAt ? new Date(data.createdAt).getTime() : startDate.getTime();
  const daysPassed = Math.max(0, Math.floor((Date.now() - creationMs) / MS_PER_DAY));
  const daysLeft = Math.max(0, totalDays - daysPassed);
  const remainingDaysPercent = Math.min(Math.max((daysLeft / totalDays) * 100, 0), 100);

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

            {daysLeft <= 0 ? (
              <span className="text-rose-500 font-semibold text-[11px]">
                مهلت به پایان رسیده (نیاز به تمدید)
              </span>
            ) : (
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <span className="font-semibold text-foreground">
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
            progress={remainingDaysPercent}
            variant={daysLeft <= 7 ? "rose" : "amber"}
            className="h-2"
          />
        </div>
      )}
    </div>
  );
}
