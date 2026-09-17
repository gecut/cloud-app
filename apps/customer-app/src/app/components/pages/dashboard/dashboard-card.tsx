import { Service } from "@/app/data";
import { cn, toast } from "@heroui/react";
import { ServerSquareCloud } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { LayersMinimalistic } from "@solar-icons/react-perf/category/tools/BoldDuotone";
import { Factor } from "./factor";
import { Progress } from "../../common/progress";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface DashboardCardProps {
  data: Service;
}

export function DashboardCard({ data }: DashboardCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  const startDate =
    data.purchaseDate instanceof Date
      ? data.purchaseDate
      : data.startDate instanceof Date
      ? data.startDate
      : new Date(data.purchaseDate || data.startDate || Date.now());

  const renewalDate =
    data.renewalDate instanceof Date
      ? data.renewalDate
      : new Date(data.renewalDate || (startDate.getTime() + 30 * MS_PER_DAY));

  const trackingType = (data.trackingType || "HYBRID").toUpperCase();
  const showDays = trackingType === "TIME" || trackingType === "HYBRID";
  const showQty = trackingType === "QUANTITY" || trackingType === "HYBRID";
  const isPackage = trackingType === "QUANTITY" || data.type === "PACKAGE";

  const totalQty = data.quantity || 1;
  const remainedQty = data.remainedQuantity ?? Math.max(0, totalQty - (data.usedQuantity || 0));
  const quantityPercent = Math.min(Math.max((remainedQty / totalQty) * 100, 0), 100);

  // 1. بازه زمانی کلی یا دوره تعیین‌شده
  const rawCycle = Number(data.billingCycle);
  const configuredCycleDays = !isNaN(rawCycle) && rawCycle > 0 ? rawCycle : null;
  const rawTotalDays = Math.round((renewalDate.getTime() - startDate.getTime()) / MS_PER_DAY);
  const totalDays = configuredCycleDays || Math.max(1, rawTotalDays);

  // 2. روزشمار معطوف به روزهای سپری‌شده
  const creationMs = data.createdAt ? new Date(data.createdAt).getTime() : startDate.getTime();
  const daysPassed = Math.max(0, Math.floor((Date.now() - creationMs) / MS_PER_DAY));
  const daysLeft = Math.max(0, totalDays - daysPassed);

  const remainingDaysPercent = Math.min(
    Math.max((daysLeft / totalDays) * 100, 0),
    100,
  );

  // 3. آلارم در صورت مغایرت دوره تعیین‌شده با بازه زمانی
  const isAlarmExceeded = trackingType !== "QUANTITY" && configuredCycleDays !== null && configuredCycleDays > totalDays;

  const statusStyle: Record<Service["status"], string> = {
    ACTIVE: "bg-green-400",
    INACTIVE: "bg-red-400",
    SUSPENDED: "bg-yellow-400",
  };

  const renewMutation = useMutation({
    mutationFn: async () => {
      return apiClient("/invoices", {
        method: "POST",
        body: JSON.stringify({
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
          items: [
            {
              serviceId: data.id,
              title: isPackage
                ? `تمدید بسته ${data.name} (${totalQty.toLocaleString("fa-IR")} عدد)`
                : `تمدید دوره‌ای ${data.name}`,
              quantity: totalQty,
              unitPriceToman: data.priceToman,
              totalToman: data.priceToman,
            },
          ],
        }),
      });
    },
    onSuccess: () => {
      toast.success("صورت‌حساب تمدید با موفقیت صادر شد. در حال انتقال به درگاه پرداخت...");
      queryClient.invalidateQueries({ queryKey: ["customer", "invoices"] });
      queryClient.invalidateQueries({ queryKey: ["customer", "payments"] });
      setTimeout(() => {
        navigate({ to: "/payments" });
      }, 600);
    },
    onError: (err: any) => {
      toast.danger(err.message || "خطا در صدور صورت‌حساب تمدید");
    },
  });

  const handleRenewService = () => {
    if (renewMutation.isPending) return;
    renewMutation.mutate();
  };

  return (
    <div className="flex flex-col w-full gap-3">
      <div className="flex flex-col gap-6 w-full p-6 sm:p-8 rounded-3xl bg-surface border border-border/40 shadow-xs">
        <div className="w-full flex items-start justify-between">
          <div className="flex items-center gap-4">
            {isPackage ? (
              <LayersMinimalistic size={50} className="*:stroke-1 text-amber-500" />
            ) : (
              <ServerSquareCloud size={50} className="*:stroke-1 text-primary" />
            )}

            <div className="flex flex-col justify-center gap-2">
              <span className="leading-none font-semibold text-md">
                {data.name || data.serviceType?.name || "سرویس ابری"}
              </span>

              <span className="text-xs font-normal leading-none text-muted-foreground">
                {data.description || (isPackage ? `بسته دارای ${totalQty.toLocaleString("fa-IR")} سهمیه فعال` : "سرویس فعال زیرساخت ابری")}
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

        <div className="w-full flex flex-col gap-3">
          {/* Days Remaining Progress (TIME & HYBRID) */}
          {showDays && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span>مدت زمان باقی‌مانده</span>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-semibold text-foreground">
                    {daysLeft.toLocaleString("fa-IR")} روز مانده
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    ({Math.round(remainingDaysPercent).toLocaleString("fa-IR")}٪ از بازه {totalDays.toLocaleString("fa-IR")} روزه)
                  </span>
                </div>
              </div>
              {isAlarmExceeded && (
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium animate-pulse flex items-center gap-1">
                  <span>⚠️ هشدار: دوره تعیین‌شده ({configuredCycleDays?.toLocaleString("fa-IR")} روز) بیشتر از بازه زمانی سررسید ({totalDays.toLocaleString("fa-IR")} روز) است</span>
                </div>
              )}
              <Progress progress={remainingDaysPercent} />
            </div>
          )}

          {/* Quantity Remaining Progress (QUANTITY & HYBRID) */}
          {showQty && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span>سهمیه / باقی‌مانده بسته</span>
                <div className="flex items-center gap-1 font-mono">
                  <span className="font-semibold text-foreground">
                    {remainedQty.toLocaleString("fa-IR")} از {totalQty.toLocaleString("fa-IR")} عدد
                  </span>
                  <span className="text-muted-foreground text-[11px]">
                    ({Math.round(quantityPercent).toLocaleString("fa-IR")}٪ باقی‌مانده)
                  </span>
                </div>
              </div>
              <Progress progress={quantityPercent} />
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-3 border-t border-border/40 mt-1">
            <span className="text-muted-foreground">
              {trackingType === "QUANTITY" ? "مبلغ بسته" : "هزینه دوره سرویس"}
            </span>
            <span className="font-semibold text-foreground font-mono">
              {Number(data.priceToman || 0).toLocaleString("fa-IR")}{" "}
              <span className="text-[10px] text-muted-foreground font-normal">تومان</span>
            </span>
          </div>
        </div>
      </div>
      <Factor
        price={data.priceToman}
        title={isPackage ? "هزینه تمدید یا خرید مجدد بسته" : "هزینه تمدید دوره"}
        actionText={renewMutation.isPending ? "در حال صدور فاکتور..." : "تمدید سرویس"}
        showAction={daysLeft <= 10 || isPackage}
        onAction={handleRenewService}
      />
    </div>
  );
}
