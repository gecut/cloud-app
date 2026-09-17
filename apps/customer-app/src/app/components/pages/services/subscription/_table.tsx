import { formatJalaliDate } from "@gecut-cloud/contracts";

interface TableProps {
  data: { date: Date; totalVolume: number; price: number };
}
export function Table({ data }: TableProps) {
  return (
    <div className="w-full rounded-xl overflow-hidden flex flex-col text-xs bg-surface-secondary/80 border border-border/20 divide-y divide-border/20">
      <div className="flex items-center justify-between py-2.5 px-4 sm:px-5">
        <span className="text-xs text-muted-foreground font-medium">حجم کل بسته</span>
        <span className="font-semibold font-mono">{data.totalVolume.toLocaleString("fa-IR")} عدد</span>
      </div>

      <div className="flex items-center justify-between py-2.5 px-4 sm:px-5 bg-surface/50">
        <span className="text-xs text-muted-foreground font-medium">تاریخ خرید و ثبت</span>
        <span className="font-mono">{formatJalaliDate(data.date)}</span>
      </div>

      <div className="flex items-center justify-between py-2.5 px-4 sm:px-5">
        <span className="text-xs text-muted-foreground font-medium">مبلغ سرویس</span>
        <span className="font-semibold font-mono text-primary">
          {data.price > 0 ? `${data.price.toLocaleString("fa-IR")} تومان` : "رایگان / هدیه"}
        </span>
      </div>
    </div>
  );
}
