import { Payments } from "@/app/data";
import { formatJalaliDate } from "@gecut-cloud/contracts";
import { CheckCircle } from "@solar-icons/react-perf/category/ui/Outline/CheckCircle";
import { cn } from "tailwind-variants";

type TableProps = {
  payments: Payments;
};

export function Table({ payments }: TableProps) {
  const deadlineDate = payments.paymentDeadline ? new Date(payments.paymentDeadline) : null;
  const isOverdue =
    payments.status !== "paid" &&
    payments.status !== "cancelled" &&
    deadlineDate !== null &&
    !isNaN(deadlineDate.getTime()) &&
    Date.now() > deadlineDate.getTime();

  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const overdueDays = isOverdue
    ? Math.max(1, Math.floor((Date.now() - deadlineDate!.getTime()) / MS_PER_DAY))
    : 0;

  return (
    <div className="w-full flex flex-col gap-4 rounded-xl overflow-hidden text-xs">
      <div className="w-full ">
        <div className="flex items-center justify-between py-2.5 px-4 bg-accent-soft-hover/30 gap-3">
          <span className="text-muted-foreground shrink-0">عنوان خدمات</span>
          <span className="font-medium text-foreground text-left line-clamp-1 break-words min-w-0">{payments.title}</span>
        </div>
        <div className="flex items-center justify-between py-2.5 px-4 bg-accent-soft gap-3">
          <span className="text-muted-foreground shrink-0">تاریخ صدور</span>
          <span className="font-mono text-left">{formatJalaliDate(payments.factorCreated)}</span>
        </div>
        <div
          className={cn(
            "flex items-center justify-between py-2.5 px-4 gap-3",
            isOverdue
              ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 font-medium"
              : "bg-accent-soft-hover/30",
          )}
        >
          <span className={cn("shrink-0", isOverdue ? "text-rose-700 dark:text-rose-300 font-medium" : "text-muted-foreground")}>
            سررسید پرداخت
          </span>
          <div className="flex items-center gap-1.5 font-mono text-left flex-wrap justify-end">
            <span className={cn(isOverdue ? "text-rose-600 font-bold" : "")}>
              {formatJalaliDate(payments.paymentDeadline)}
            </span>
            {isOverdue && (
              <span className="text-[10px] bg-rose-500/20 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full font-medium font-sans whitespace-nowrap">
                ({overdueDays.toLocaleString("fa-IR")} روز گذشته)
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between py-2.5 px-4 bg-accent-soft gap-3">
          <span className="text-muted-foreground shrink-0">مبلغ قابل پرداخت</span>
          <span className="font-semibold text-foreground whitespace-nowrap">
            {(payments.price || 0) === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">رایگان</span>
            ) : (
              `${(payments.price || 0).toLocaleString("fa-IR")} تومان`
            )}
          </span>
        </div>

        <div
          className={cn(
            "w-full flex items-center justify-between text-center rounded-b-2xl px-4 py-2.5 gap-2",
            payments.status === "paid"
              ? "bg-success text-success-foreground"
              : payments.status === "cancelled"
              ? "bg-muted text-muted-foreground"
              : isOverdue
              ? "bg-rose-600 text-white"
              : "bg-[#F77F00] text-white",
          )}
        >
          <span className="text-xs opacity-80 shrink-0">وضعیت فاکتور</span>
          <div className="flex items-center gap-1.5 shrink-0">
            {payments.status === "paid" && (
              <CheckCircle size={20} className="*:stroke-1 shrink-0" />
            )}

            <span className="font-medium text-xs whitespace-nowrap">
              {payments.status === "paid"
                ? "پرداخت شده"
                : payments.status === "cancelled"
                ? "لغو شده"
                : isOverdue
                ? `منقضی شده (${overdueDays.toLocaleString("fa-IR")} روز معوقه)`
                : "در انتظار پرداخت"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
