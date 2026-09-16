import { formatJalaliDate } from "@gecut-cloud/contracts";

type TableProps = {
  data: { Date: Date | string; cycle: string; price: number };
};
export function Table({ data }: TableProps) {
  const dateStr =
    typeof data.Date === "string" && (data.Date.includes("بدون") || data.Date.includes("نامحدود"))
      ? data.Date
      : formatJalaliDate(data.Date);

  return (
    <div className="w-full rounded-xl overflow-hidden text-xs bg-accent-hover/5">
      <div className="flex items-center justify-between p-2.5 px-4">
        <span className="text-muted-foreground">تاریخ سررسید / اعتبار</span>
        <span className="font-mono">{dateStr}</span>
      </div>
      <div className="flex items-center justify-between p-2.5 px-4 bg-accent-hover/10">
        <span className=" text-muted-foreground">نوع دوره / پکیج</span>
        <span>{data.cycle}</span>
      </div>

      <div className="flex items-center justify-between p-2.5 px-4">
        <span className=" text-muted-foreground">مبلغ قرارداد</span>

        <span className="font-medium text-foreground">
          {(Number(data.price) || 0).toLocaleString("fa-IR")}{" "}
          <span className="text-xs text-muted-foreground font-normal">تومان</span>
        </span>
      </div>
    </div>
  );
}
