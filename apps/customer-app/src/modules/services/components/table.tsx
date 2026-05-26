type Row = {
  data: { Date: Date; cycle: string; price: number };
};

export function Tables({ data }: Row) {
  return (
    <div className="w-full rounded-xl overflow-hidden text-sm bg-default">
      <div className="flex items-center justify-between p-3">
        <span className="text-sm text-muted-foreground">تاریخ تمدید</span>
        <span>{new Date(data.Date).toLocaleDateString("fa-IR")}</span>
      </div>
      <div className="flex items-center justify-between p-3 bg-surface">
        <span className="text-sm text-muted-foreground">سیکل صورت حساب</span>
        <span>{data.cycle}</span>
      </div>

      <div className="flex items-center justify-between p-3">
        <span className="text-sm text-muted-foreground">قیمت</span>

        <span className="font-medium">{data.price.toLocaleString("fa-IR")}</span>
      </div>
    </div>
  );
}
