interface TableProps {
  data: { date: Date; totalVolume: number; price: number };
}
export function Table({ data }: TableProps) {
  return (
    <div className="w-full rounded-xl overflow-hidden flex flex-col text-xs bg-surface-secondary">
      <div className="flex  items-center justify-between pb-2 px-4">
        <span className="text-xs text-muted-foreground">حجم کل</span>
        <span>{data.totalVolume.toLocaleString("fa-IR")} عدد</span>
      </div>

      <div className="flex items-center justify-between p-2.5 px-4 rounded-l-xl bg-surface">
        <span className="text-xs text-muted-foreground">تاریخ خرید</span>
        <span>{data.date.toLocaleDateString("fa-IR")}</span>
      </div>

      <div className="flex items-center justify-between pt-2 px-4">
        <span className="text-xs text-muted-foreground">قیمت</span>
        <span className="font-medium">
          {data.price.toLocaleString("fa-IR")}
        </span>
      </div>
    </div>
  );
}
