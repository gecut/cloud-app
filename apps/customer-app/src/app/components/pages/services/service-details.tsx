import { Button, ProgressBar } from "@heroui/react";
import { cn } from "@heroui/styles";

import { Service } from "@/routes/_app/data";
import { Tables } from "./table";

import { Link } from "@solar-icons/react-perf/category/text-formatting/LineDuotone";
import { Server } from "@solar-icons/react-perf/category/devices/Bold";
import { ServerSquareCloud } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { ServerSquareCloudLineDuotone } from "@solar-icons/react-perf";

export interface ServiceDetailsProps {
  data: Service[];
  showIcon?: boolean;
}

export function ServicesDetail({ data, showIcon = true }: ServiceDetailsProps) {
  const statusStyle: Record<Service["status"], string> = {
    ACTIVE: "bg-green-400",
    INACTIVE: "bg-red-400",
    SUSPENDED: "bg-yellow-400",
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {data.map((x) => {
        const MS_PER_DAY = 1000 * 60 * 60 * 24;

        const totalDays =
          (x.renewalDate.getTime() - x.startDate.getTime()) / MS_PER_DAY;

        const passedDays = (Date.now() - x.startDate.getTime()) / MS_PER_DAY;

        const totalMonths = Math.round(totalDays / 30);
        const passedMonths = Math.round(passedDays / 30);

        return (
          <div key={x.id} className="w-full">
            <div className="flex w-full flex-col gap-4 rounded-3xl bg-surface p-8">
              <div className="flex w-full items-start justify-between">
                <div className="flex items-center gap-4">
                  {x.type === "SERVICE" ? (
                    <ServerSquareCloudLineDuotone size={48} />
                  ) : (
                    showIcon === false
                  )}

                  <div className="flex flex-col gap-2">
                    <span className="leading-none">{x.serviceType.name}</span>

                    <span className="text-xs leading-none">
                      {x.description}
                    </span>
                  </div>
                </div>

                {x.type === "SERVICE" ? (
                  <div className="flex items-center gap-1">
                    <div
                      className={cn(
                        "w-1 h-2 rounded-full animate-wiggle delay-250",
                        statusStyle[x.status],
                      )}
                    />

                    <div
                      className={cn(
                        "w-1 h-2 rounded-full animate-wiggle delay-450",
                        statusStyle[x.status],
                      )}
                    />

                    <div
                      className={cn(
                        "w-1 h-2 rounded-full animate-wiggle delay-650",
                        statusStyle[x.status],
                      )}
                    />
                  </div>
                ) : x.type === "DOMAIN" ? (
                  <Link size={48} />
                ) : (
                  <ServerSquareCloud size={48} />
                )}
              </div>

              <div className="flex w-full flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span>مدت زمان باقی مانده</span>

                  {passedMonths >= totalMonths ? (
                    <span>نیاز به تمدید</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span>{passedMonths.toLocaleString("fa-IR")} روز</span>/
                      <span>{totalMonths.toLocaleString("fa-IR")} روز</span>
                    </div>
                  )}
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
