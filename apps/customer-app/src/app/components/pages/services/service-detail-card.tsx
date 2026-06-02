import { Button, ProgressBar } from "@heroui/react";
import { cn } from "@heroui/styles";

import { Service } from "@/routes/_app/data";

import { Link } from "@solar-icons/react-perf/category/text-formatting/LineDuotone";
import { ServerSquareCloud } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { ServerSquareCloudLineDuotone } from "@solar-icons/react-perf";
import { Table } from "./table";
import { Progress } from "../../common/progress";

interface ServiceDetailCardProps {
  serviceDetail: Service;
  showIcon?: boolean;
}

export function ServiceDetailCard({
  serviceDetail,
  showIcon = true,
}: ServiceDetailCardProps) {
  const statusStyle: Record<Service["status"], string> = {
    ACTIVE: "bg-green-400",
    INACTIVE: "bg-red-400",
    SUSPENDED: "bg-yellow-400",
  };

  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const totalDays =
    (serviceDetail.renewalDate.getTime() - serviceDetail.startDate.getTime()) /
    MS_PER_DAY;

  const passedDays =
    (Date.now() - serviceDetail.startDate.getTime()) / MS_PER_DAY;

  const totalMonths = Math.round(totalDays / 30);
  const passedMonths = Math.round(passedDays / 30);
  const progressPercent = Math.min((passedDays / totalDays) * 100, 100);

  return (
    <div className="w-full">
      <div className="flex w-full flex-col gap-4 rounded-3xl bg-surface p-6">
        <div className="flex w-full items-start justify-between">
          <div className="flex items-center gap-4">
            {showIcon &&
              (serviceDetail.type === "SERVICE" ? (
                <ServerSquareCloudLineDuotone
                  size={48}
                  className="*:stroke-1"
                />
              ) : null)}

            <div className="flex flex-col gap-2">
              <span className="leading-none text-md">
                {serviceDetail.serviceType.name}
              </span>

              <span className="text-xs leading-none">
                {serviceDetail.description}
              </span>
            </div>
          </div>

          {serviceDetail.type === "SERVICE" ? (
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "w-1 h-2 rounded-full animate-wiggle delay-250",
                  statusStyle[serviceDetail.status],
                )}
              />
              <div
                className={cn(
                  "w-1 h-2 rounded-full animate-wiggle delay-450",
                  statusStyle[serviceDetail.status],
                )}
              />
              <div
                className={cn(
                  "w-1 h-2 rounded-full animate-wiggle delay-650",
                  statusStyle[serviceDetail.status],
                )}
              />
            </div>
          ) : serviceDetail.type === "DOMAIN" ? (
            <Link size={48} />
          ) : (
            <ServerSquareCloud size={48} />
          )}
        </div>

        <div className="flex w-full flex-col gap-1 text-xs">
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
          <Progress progress={progressPercent} />
        </div>

        <Table
          data={{
            Date: serviceDetail.renewalDate,
            cycle: "ماهانه",
            price: serviceDetail.priceToman,
          }}
        />

        <Button
          variant="primary"
          size="lg"
          className="w-full rounded-md font-light"
        >
          مدیریت سرویس
        </Button>
      </div>
    </div>
  );
}
