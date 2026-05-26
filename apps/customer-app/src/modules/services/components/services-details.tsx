import { DashboardService } from "@/modules/dashboard/_mock/dashboard.mock";
import { Button, ProgressBar } from "@heroui/react";
import { cn } from "@heroui/styles";
import { ServerSquareCloud } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { Tables } from "./table";
import { ReactNode } from "react";

export interface ServiceDetailsProps {
  data: DashboardService[];
  icon?: ReactNode | string;
  showIcon?: boolean | true;
}
export function ServicesDetail({ data, icon, showIcon }: ServiceDetailsProps) {
  return (
    <div className="w-full flex flex-col items-center gap-4">
      {data.map((x) => {
        const MS_PER_DAY = 1000 * 60 * 60 * 24;

        const totalDays =
          (x.renewalDate.getTime() - x.startDate.getTime()) / MS_PER_DAY;

        const passedDays = (Date.now() - x.startDate.getTime()) / MS_PER_DAY;

        const totalMonths = Math.round(totalDays / 30);
        const passedMonths = Math.round(passedDays / 30);

        const style: Record<DashboardService["status"], string> = {
          ACTIVE: "bg-green-400",
          INACTIVE: "bg-red-400",
          SUSPENDED: "bg-yellow-400",
        };

        return (
          <div key={x.id} className="flex flex-col w-full gap-4">
            <div className="flex flex-col gap-4 w-full p-8 rounded-3xl bg-surface">
              <div className="w-full flex items-start justify-between">
                <div className="flex items-center mb-4 gap-4">
                  {showIcon ?? <ServerSquareCloud size={50} />}

                  <div className="flex flex-col justify-center gap-2">
                    <span className="leading-none">{x.serviceType.name}</span>

                    <span className="text-xs leading-none">
                      {x.description}
                    </span>
                  </div>
                </div>
                {icon ?? (
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
                )}
              </div>

              <div className="w-full flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>مدت زمان باقی مانده</span>

                  <div className="flex items-center gap-1">
                    <span className="flex items-center gap-1">
                      {passedMonths.toLocaleString("fa-IR")}روز
                    </span>
                    /
                    <span className="flex items-center gap-1">
                      {totalMonths.toLocaleString("fa-IR")}روز
                    </span>
                  </div>
                </div>

                <ProgressBar
                  aria-label="Loading"
                  className="w-full"
                  value={Math.min((passedDays / totalDays) * 100, 100)}
                >
                  <ProgressBar.Track>
                    <ProgressBar.Fill />
                  </ProgressBar.Track>
                </ProgressBar>
              </div>
              <Tables
                data={{
                  Date: x.renewalDate,
                  cycle: "ماهانه",
                  price: x.priceToman,
                }}
              />
              <Button
                variant="primary"
                size="lg"
                className="w-full rounded-xl font-light"
              >
                مدیریت سرویس
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
