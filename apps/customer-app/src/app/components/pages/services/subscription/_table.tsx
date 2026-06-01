interface TableProps {
  data: { date: Date; totalVolume: number; price: number };
}
export function Table({ data }: TableProps) {
  return (
    <div className="w-full rounded-xl overflow-hidden flex flex-col text-sm bg-surface-secondary">
      <div className="flex items-center justify-between p-3">
        <span className="text-sm text-muted-foreground">حجم کل</span>
        <span>{data.totalVolume}</span>
      </div>

      <div className="flex items-center justify-between p-3 rounded-l-2xl bg-surface">
        <span className="text-sm text-muted-foreground">تاریخ خرید</span>
        <span>{data.date.toLocaleDateString("fa-IR")}</span>
      </div>

      <div className="flex items-center justify-between p-3">
        <span className="text-sm text-muted-foreground">قیمت</span>
        <span className="font-medium">
          {data.price.toLocaleString("fa-IR")}
        </span>
      </div>
    </div>
  );
}
