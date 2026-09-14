import { Service } from "@/app/data";
import { cn } from "@heroui/react";
import { ServerSquareCloud } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { Factor } from "./factor";
import { Progress } from "../../common/progress";

interface DashboardCardProps {
  data: Service;
}

export function DashboardCard({ data }: DashboardCardProps) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const totalDays =
    (data.renewalDate.getTime() - data.startDate.getTime()) / MS_PER_DAY;

  const passedDays = (Date.now() - data.startDate.getTime()) / MS_PER_DAY;

  const totalMonths = Math.round(totalDays / 30);
  const passedMonths = Math.round(passedDays / 30);

  const progressPercent = Math.min(
    Math.max((passedMonths / totalMonths) * 100, 0),
    100,
  );

  const statusStyle: Record<Service["status"], string> = {
    ACTIVE: "bg-green-400",
    INACTIVE: "bg-red-400",
    SUSPENDED: "bg-yellow-400",
  };

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="flex flex-col gap-6 w-full p-8 rounded-[20px] bg-surface">
        <div className="w-full flex items-start justify-between">
          <div className="flex items-center gap-4">
            <ServerSquareCloud size={50} className="*:stroke-1" />

            <div className="flex flex-col justify-center gap-2">
              <span className="leading-none font-semibold text-md">
                {data.serviceType.name}
              </span>

              <span className="text-xs font-normal leading-none">
                {data.description}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <div
              className={cn(
                "w-1 h-2 rounded-full animate-wiggle delay-200",
                statusStyle[data.status],
              )}
            />

            <div
              className={cn(
                "w-1 h-2 rounded-full animate-wiggle delay-400",
                statusStyle[data.status],
              )}
            />

            <div
              className={cn(
                "w-1 h-2 rounded-full animate-wiggle delay-700",
                statusStyle[data.status],
              )}
            />
          </div>
        </div>

        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs">
            <span>مدت زمان باقی مانده</span>

            <div className="flex items-center gap-1">
              <span>{passedMonths.toLocaleString("fa-IR")} روز</span>/
              <span>{totalMonths.toLocaleString("fa-IR")} روز</span>
            </div>
          </div>
          <Progress progress={progressPercent} />
        </div>
      </div>
      <Factor price={data.priceToman} />
    </div>
  );
}
