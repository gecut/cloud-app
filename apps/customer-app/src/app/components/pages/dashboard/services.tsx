import { Service } from "@/routes/_app/data";
import { cn, ProgressBar } from "@heroui/react";
import { ServerSquareCloud } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { Factor } from "./factor";

export interface ServiceDetailsProps {
  data: Service[];
}

export function Services({ data }: ServiceDetailsProps) {
  return (
    <div className="w-full flex flex-col items-center gap-4">
      {data.map((x) => {
        const totalDuration = x.renewalDate.getTime() - x.startDate.getTime();

        const passedDuration = Date.now() - x.startDate.getTime();

        const progress = Math.min(
          Math.max((passedDuration / totalDuration) * 100, 0),
          100,
        );
        const style: Record<Service["status"], string> = {
          ACTIVE: "bg-green-400",
          INACTIVE: "bg-red-400",
          SUSPENDED: "bg-yellow-400",
        };

        return (
          <div key={x.id} className="flex flex-col w-full gap-2">
            <div className="flex flex-col gap-6 w-full p-8 rounded-3xl bg-surface">
              <div className="w-full flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <ServerSquareCloud size={48} className="*:stroke-[0.5]" />

                  <div className="flex flex-col justify-center gap-2">
                    <span className="leading-none">{x.serviceType.name}</span>

                    <span className="text-xs leading-none">
                      {x.description}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <div
                    className={cn(
                      "w-1 h-2 rounded-full animate-wiggle delay-200",
                      style[x.status],
                    )}
                  />

                  <div
                    className={cn(
                      "w-1 h-2 rounded-full animate-wiggle delay-400",
                      style[x.status],
                    )}
                  />

                  <div
                    className={cn(
                      "w-1 h-2 rounded-full animate-wiggle delay-700",
                      style[x.status],
                    )}
                  />
                </div>
              </div>

              <div className="w-full flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <span>مدت زمان باقی مانده</span>

                  <div className="flex items-center gap-1">
                    <span className="flex items-center gap-1">
                      {x.startDate.toLocaleDateString("fa-IR")}
                    </span>
                    -
                    <span className="flex items-center gap-1">
                      {x.renewalDate.toLocaleDateString("fa-IR")}
                    </span>
                  </div>
                </div>

                <ProgressBar
                  aria-label="Loading"
                  className="w-full"
                  value={progress}
                >
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
              </div>
            </div>
            <Factor price={x.priceToman} />
          </div>
        );
      })}
    </div>
  );
}
