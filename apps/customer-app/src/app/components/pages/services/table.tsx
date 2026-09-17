import { formatJalaliDate } from "@gecut-cloud/contracts";

type TableProps = {
  data: {
    Date: Date | string;
    cycle: string;
    price: number;
    startDate?: Date | string;
    spanDays?: number;
    daysLeft?: number;
  };
};

export function Table({ data }: TableProps) {
  const dateStr =
    typeof data.Date === "string" && (data.Date.includes("بدون") || data.Date.includes("نامحدود"))
      ? data.Date
      : formatJalaliDate(data.Date);

  const startDateStr = data.startDate ? formatJalaliDate(data.startDate) : null;

  return (
    <div className="w-full rounded-2xl overflow-hidden text-xs bg-surface-secondary/80 border border-border/30 divide-y divide-border/20">
      <div className="flex items-center justify-between py-3 px-4 sm:px-5">
        <span className="text-muted-foreground font-medium">تاریخ سررسید / پایان دوره</span>
        <span className="font-mono font-semibold text-foreground">{dateStr}</span>
      </div>

      {startDateStr && (
        <div className="flex items-center justify-between py-3 px-4 sm:px-5 bg-surface/50">
          <span className="text-muted-foreground font-medium">تاریخ شروع / خرید</span>
          <span className="font-mono">{startDateStr}</span>
        </div>
      )}

      {data.spanDays !== undefined && (
        <div className="flex items-center justify-between py-3 px-4 sm:px-5">
          <span className="text-muted-foreground font-medium">طول بازه زمانی سررسید</span>
          <span className="font-mono font-semibold text-foreground">
            {data.spanDays.toLocaleString("fa-IR")} روز
          </span>
        </div>
      )}

      <div className="flex items-center justify-between py-3 px-4 sm:px-5 bg-surface/50">
        <span className="text-muted-foreground font-medium">نوع دوره / پکیج</span>
        <span className="font-medium">{data.cycle}</span>
      </div>

      <div className="flex items-center justify-between py-3 px-4 sm:px-5">
        <span className="text-muted-foreground font-medium">مبلغ قرارداد</span>
        <span className="font-semibold text-foreground font-mono">
          {(Number(data.price) || 0).toLocaleString("fa-IR")}{" "}
          <span className="text-xs text-muted-foreground font-normal">تومان</span>
        </span>
      </div>
    </div>
  );
}
