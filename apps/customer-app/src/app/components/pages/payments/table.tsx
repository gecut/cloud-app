import { Payments } from "@/app/data";
import { formatJalaliDate } from "@gecut-cloud/contracts";
import { CheckCircle } from "@solar-icons/react-perf/category/ui/Outline/CheckCircle";
import { cn } from "tailwind-variants";

type TableProps = {
  payments: Payments;
};

export function Table({ payments }: TableProps) {
  return (
    <div className="w-full flex flex-col gap-4 rounded-xl overflow-hidden text-xs">
      <div className="w-full ">
        <div className="flex items-center justify-between py-2.5 px-4 bg-accent-soft-hover/30">
          <span className="text-muted-foreground">عنوان خدمات</span>
          <span className="font-medium text-foreground">{payments.title}</span>
        </div>
        <div className="flex items-center justify-between py-2.5 px-4 bg-accent-soft">
          <span className="text-muted-foreground">تاریخ صدور</span>
          <span>{formatJalaliDate(payments.factorCreated)}</span>
        </div>
        <div className="flex items-center justify-between py-2.5 px-4 bg-accent-soft-hover/30">
          <span className="text-muted-foreground">سررسید پرداخت</span>
          <span>{formatJalaliDate(payments.paymentDeadline)}</span>
        </div>
        <div className="flex items-center justify-between py-2.5 px-4 bg-accent-soft">
          <span className="text-muted-foreground">مبلغ قابل پرداخت</span>
          <span className="font-semibold text-foreground">
            {(payments.price || 0).toLocaleString("fa-IR")} تومان
          </span>
        </div>

        <div
          className={cn(
            "w-full flex items-center justify-between text-center rounded-b-2xl px-4 py-2",
            payments.status === "paid"
              ? "bg-success text-success-foreground"
              : payments.status === "cancelled"
              ? "bg-muted text-muted-foreground"
              : "bg-[#F77F00] text-white",
          )}
        >
          <span className="text-xs opacity-80">وضعیت فاکتور</span>
          {payments.status === "paid" && (
            <CheckCircle size={24} className="*:stroke-1" />
          )}

          <span className="font-medium">
            {payments.status === "paid"
              ? "پرداخت شده"
              : payments.status === "cancelled"
              ? "لغو شده"
              : "در انتظار پرداخت"}
          </span>
        </div>
      </div>
    </div>
  );
}
