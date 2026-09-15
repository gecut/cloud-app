import { Button, ProgressBar } from "@heroui/react";
import { cn } from "@heroui/styles";

import { Service } from "@/app/data";

import { Link } from "@solar-icons/react-perf/category/text-formatting/LineDuotone";
import { ServerSquareCloud } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { ServerSquareCloudLineDuotone } from "@solar-icons/react-perf";
import { Table } from "./table";
import { Progress } from "../../common/progress";

interface ServiceDetailCardProps {
  serviceDetail: Service;
  showIcon?: boolean;
}

function formatCycleDays(cycle?: string | number, totalDays?: number) {
  const num = Number(cycle);
  if (!isNaN(num) && num > 0) {
    return `${num.toLocaleString("fa-IR")} روزه`;
  }
  if (totalDays && totalDays > 0) {
    return `${totalDays.toLocaleString("fa-IR")} روزه`;
  }
  return "۳۰ روزه";
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

  const startDate =
    serviceDetail.startDate instanceof Date
      ? serviceDetail.startDate
      : new Date(serviceDetail.startDate || Date.now());

  const renewalDate =
    serviceDetail.renewalDate instanceof Date
      ? serviceDetail.renewalDate
      : new Date(serviceDetail.renewalDate || Date.now());

  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const isPackage = serviceDetail.type === "PACKAGE" || (serviceDetail.quantity && serviceDetail.quantity > 0);
  const totalQty = serviceDetail.quantity || 1;
  const remainedQty = serviceDetail.remainedQuantity ?? serviceDetail.quantity ?? 1;
  const quantityPercent = Math.min(Math.max((remainedQty / totalQty) * 100, 0), 100);

  const rawTotalDays = (renewalDate.getTime() - startDate.getTime()) / MS_PER_DAY;
  const totalDays = Math.max(1, Math.round(rawTotalDays));
  const rawDaysLeft = (renewalDate.getTime() - Date.now()) / MS_PER_DAY;
  const daysLeft = Math.max(0, Math.ceil(rawDaysLeft));

  const remainingDaysPercent = Math.min(Math.max((daysLeft / totalDays) * 100, 0), 100);
  const displayProgress = isPackage ? quantityPercent : remainingDaysPercent;

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
              <span className="leading-none text-md font-bold">
                {serviceDetail.name || serviceDetail.serviceType?.name || "سرویس ابری"}
              </span>

              <span className="text-xs leading-none text-muted-foreground">
                {serviceDetail.description || serviceDetail.serviceType?.name}
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
            <span>{isPackage ? "سهمیه / باقی‌مانده بسته" : "مدت زمان باقی‌مانده"}</span>

            {isPackage ? (
              <div className="flex items-center gap-1 font-mono">
                <span className="font-semibold text-foreground">
                  {remainedQty.toLocaleString("fa-IR")} از {totalQty.toLocaleString("fa-IR")} عدد
                </span>
                <span className="text-muted-foreground text-[11px]">
                  ({Math.round(quantityPercent).toLocaleString("fa-IR")}٪ باقی‌مانده)
                </span>
              </div>
            ) : daysLeft <= 0 ? (
              <span className="text-rose-500 font-medium">نیاز به تمدید</span>
            ) : (
              <div className="flex items-center gap-1">
                <span className="font-medium text-foreground font-mono">{daysLeft.toLocaleString("fa-IR")} روز مانده</span>
                <span className="text-muted-foreground text-[11px]">
                  ({Math.round(remainingDaysPercent).toLocaleString("fa-IR")}٪ از {totalDays.toLocaleString("fa-IR")} روز)
                </span>
              </div>
            )}
          </div>
          <Progress progress={displayProgress} />
        </div>

        <Table
          data={{
            Date: renewalDate,
            cycle: formatCycleDays(serviceDetail.billingCycle, totalDays),
            price: serviceDetail.priceToman,
          }}
        />

        <Button
          variant="primary"
          size="lg"
          className="w-full rounded-md font-light"
          onPress={() => {
            window.location.href = "/payments";
          }}
        >
          مدیریت و پرداخت صورت‌حساب
        </Button>
      </div>
    </div>
  );
}
