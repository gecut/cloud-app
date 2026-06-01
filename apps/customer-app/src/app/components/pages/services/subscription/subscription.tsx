import { ProgressCircle } from "@heroui/react";
import { GalleryWide } from "@solar-icons/react-perf/category/video/LineDuotone";
import { Table } from "./_table";
import { subscriptions } from "@/routes/_app/data";

export function Subscription() {
  const dt = subscriptions.find((x) => x.title);
  const remain = ((dt?.remainedVolume ?? NaN) / (dt?.totalVolume ?? NaN)) * 100;
  return (
    <div className="w-full flex flex-col items-center gap bg-surface rounded-2xl gap-4 p-8">
      <div className="w-full flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <span className="text-md font-semibold">{dt?.title}</span>
          <span className="text-sm text-yellow-400">{dt?.subTitle}</span>
        </div>
        <GalleryWide size={48} />
      </div>
      <div className="w-full bg-surface-secondary p-2 rounded-2xl flex items-center gap-4 justify-around">
        <Table
          data={{
            date: dt!.buyData,
            price: dt?.price ?? NaN,
            totalVolume: dt?.totalVolume ?? NaN,
          }}
        />
        <div className="flex flex-col items-center gap-4 ml-4">
          <ProgressCircle aria-label="Loading" value={remain}>
            <ProgressCircle.Track className="size-16">
              <ProgressCircle.TrackCircle />
              <ProgressCircle.FillCircle />
            </ProgressCircle.Track>
            <span className="absolute z-10 text-md">
              {remain.toLocaleString("fa-IR")}%
            </span>
          </ProgressCircle>
          <label className="text-xs">
            مانده {remain.toLocaleString("fa-IR")}{" "}
          </label>
        </div>
      </div>
    </div>
  );
}
