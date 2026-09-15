import { Subscription } from "@/app/data";
import { ProgressCircle } from "@heroui/react";
import { LayersMinimalistic } from "@solar-icons/react-perf/category/tools/BoldDuotone";
import { Table } from "./_table";

interface SubscriptionCardProps {
  data: Subscription;
}

export function SubscriptionCard({ data }: SubscriptionCardProps) {
  const total = Number(data?.totalVolume) || 1;
  const remained = Number(data?.remainedVolume) ?? total;
  const remainPercent = Math.min(Math.max(Math.round((remained / total) * 100), 0), 100);

  return (
    <div className="w-full flex flex-col items-center gap-4 bg-surface rounded-2xl p-6 border border-border/40 shadow-xs">
      <div className="w-full flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <span className="text-base font-bold text-foreground">{data.title}</span>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">{data.subTitle}</span>
        </div>

        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <LayersMinimalistic size={32} />
        </div>
      </div>

      <div className="w-full bg-surface-secondary/70 p-3 rounded-2xl flex items-center justify-between gap-4 border border-border/30">
        <Table
          data={{
            date: data.buyData,
            price: data.price,
            totalVolume: total,
          }}
        />

        <div className="flex flex-col items-center gap-1.5 px-3">
          <ProgressCircle aria-label="باقی‌مانده بسته" value={remainPercent} className="text-amber-500">
            <ProgressCircle.Track className="size-16">
              <ProgressCircle.TrackCircle />
              <ProgressCircle.FillCircle />
            </ProgressCircle.Track>

            <span className="absolute z-10 text-xs font-bold font-mono">
              {remainPercent.toLocaleString("fa-IR")}%
            </span>
          </ProgressCircle>

          <label className="text-[11px] whitespace-nowrap font-medium text-muted-foreground font-mono">
            {remained.toLocaleString("fa-IR")} عدد مانده
          </label>
        </div>
      </div>
    </div>
  );
}
