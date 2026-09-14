import { Subscription } from "@/app/data";
import { ProgressCircle } from "@heroui/react";
import { GalleryWide } from "@solar-icons/react-perf/category/video/LineDuotone";
import { Table } from "./_table";

interface SubscriptionCardProps {
  data: Subscription;
}

export function SubscriptionCard({ data }: SubscriptionCardProps) {
  const remain =
    ((data?.remainedVolume ?? NaN) / (data?.totalVolume ?? NaN)) * 100;
  return (
    <div className="w-full flex flex-col items-center gap-4  bg-surface rounded-2xl p-6">
      <div className="w-full flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-md font-semibold">{data.title}</span>
          <span className="text-sm text-yellow-400">{data.subTitle}</span>
        </div>

        <GalleryWide size={48} />
      </div>

      <div className="w-full bg-surface-secondary pl-2 py-2 rounded-2xl flex items-center justify-around gap-4">
        <Table
          data={{
            date: data.buyData,
            price: data.price,
            totalVolume: data.totalVolume,
          }}
        />

        <div className="flex flex-col items-center gap-2 ml-4">
          <ProgressCircle aria-label="Loading" value={remain}>
            <ProgressCircle.Track className="size-16">
              <ProgressCircle.TrackCircle />
              <ProgressCircle.FillCircle />
            </ProgressCircle.Track>

            <span className="absolute z-10 text-md">
              {remain.toLocaleString("fa-IR")}%
            </span>
          </ProgressCircle>

          <label className="text-xs whitespace-nowrap">
            مانده {remain.toLocaleString("fa-IR")}
          </label>
        </div>
      </div>
    </div>
  );
}
