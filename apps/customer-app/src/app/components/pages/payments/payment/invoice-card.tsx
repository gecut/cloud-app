import { Payments } from "@/app/data";
import { Server2 } from "@solar-icons/react-perf/category/devices/Bold";
import { GalleryWide } from "@solar-icons/react-perf/category/video/Bold";
import { cn } from "tailwind-variants";
import { Table } from "../table";
import { Button } from "@heroui/react/button";

export function InvoiceCard({
  data,
  className,
  onPay,
  isPaying = false,
  onCancel,
  isCancelling = false,
  onReactivate,
  isReactivating = false,
}: {
  data: Payments;
  className?: string;
  onPay?: (invoice: Payments) => void;
  isPaying?: boolean;
  onCancel?: (invoice: Payments) => void;
  isCancelling?: boolean;
  onReactivate?: (invoice: Payments) => void;
  isReactivating?: boolean;
}) {
  const deadlineDate = data.paymentDeadline ? new Date(data.paymentDeadline) : null;
  const isOverdue =
    data.status === "Awaiting payment" &&
    deadlineDate !== null &&
    !isNaN(deadlineDate.getTime()) &&
    Date.now() > deadlineDate.getTime();

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const overdueDays = isOverdue
    ? Math.max(1, Math.floor((Date.now() - deadlineDate!.getTime()) / MS_PER_DAY))
    : 0;

  return (
    <div
      className={cn(
        "w-full flex flex-col gap-5 bg-surface p-6 sm:p-7 rounded-3xl border border-border/40 shadow-xs",
        isOverdue && "border-rose-500/40 ring-1 ring-rose-500/20",
        className,
      )}
    >
      <div className="w-full flex items-center justify-between pb-3 border-b border-border/30 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">شماره فاکتور:</span>
          <span className="text-accent font-semibold font-mono text-sm">
            {typeof data.factorNumber === "number"
              ? data.factorNumber.toLocaleString("fa-IR")
              : data.factorNumber}
          </span>
        </div>
        {isOverdue && (
          <span className="text-[10px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full">
            منقضی شده ({overdueDays.toLocaleString("fa-IR")} روز معوقه)
          </span>
        )}
      </div>
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col justify-center gap-2.5">
            <span className="leading-none font-medium">{data.title}</span>
            <span className="text-xs leading-none text-accent">{data.subTitle}</span>
          </div>
        </div>
        {data.type === "DOMAIN" ? (
          <GalleryWide size={48} />
        ) : (
          <Server2 size={48} />
        )}
      </div>

      {isOverdue && (
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
          <svg className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-rose-800 dark:text-rose-200">
              ⚠️ خطا: مهلت پرداخت این صورت‌حساب به پایان رسیده است
            </span>
            <span className="text-[11px] opacity-90">
              این صورت‌حساب {overdueDays.toLocaleString("fa-IR")} روز گذشته از سررسید معوقه دارد. لطفاً هرچه سریع‌تر نسبت به پرداخت اقدام نمایید.
            </span>
          </div>
        </div>
      )}

      <Table payments={data} />

      {data.status === "Awaiting payment" && (
        <div className="flex flex-col gap-2.5 w-full">
          <Button
            variant={isOverdue ? "danger" : "primary"}
            className="w-full rounded-xl font-medium py-2.5 cursor-pointer shadow-xs transition-opacity"
            isDisabled={isPaying || isCancelling}
            onPress={() => onPay?.(data)}
          >
            {isPaying ? "در حال اتصال به درگاه و ثبت پرداخت..." : isOverdue ? "پرداخت فوری فاکتور معوقه" : "پرداخت آنلاین"}
          </Button>

          {onCancel && (
            <Button
              variant="outline"
              className="w-full rounded-xl font-medium py-2 text-xs text-rose-500 border border-rose-500/30 hover:bg-rose-500/10 cursor-pointer transition-colors"
              isDisabled={isPaying || isCancelling}
              onPress={() => onCancel(data)}
            >
              {isCancelling ? "در حال لغو فاکتور..." : "لغو این فاکتور"}
            </Button>
          )}
        </div>
      )}

      {data.status === "cancelled" && (
        <div className="flex flex-col gap-3 w-full p-4 bg-muted/20 border border-border/40 rounded-2xl">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium">وضعیت فاکتور:</span>
            <span className="text-rose-500 font-semibold">لغو شده</span>
          </div>
          {onReactivate && (
            <Button
              variant="outline"
              className="w-full rounded-xl font-medium py-2.5 text-xs text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/10 cursor-pointer transition-colors"
              isDisabled={isReactivating}
              onPress={() => onReactivate(data)}
            >
              {isReactivating ? "در حال فعال‌سازی..." : "فعال‌سازی مجدد فاکتور"}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
