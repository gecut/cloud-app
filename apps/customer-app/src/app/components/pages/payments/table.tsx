import { Payments } from "@/routes/_app/data";
import { cn } from "tailwind-variants";

type TableProps = {
  data: Payments[];
};

export function Tables({ data }: TableProps) {
  return (
    <div className="w-full rounded-xl overflow-hidden text-xs">
      {data.map((x) => {
        return (
          <div className="w-full">
            <div className="flex items-center justify-between p-3 bg-accent-soft-hover/30">
              <span className=" text-muted-foreground">تاریخ ایجاد فاکتور</span>
              <span>{x.factorCreated.toLocaleDateString("fa-IR")}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-accent-soft">
              <span className=" text-muted-foreground">{x.title}بسته </span>
              <span>{x.volume}</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-accent-soft-hover/30">
              <span className=" text-muted-foreground">قیمت</span>

              <span className="font-medium">
                {x.price.toLocaleString("fa-IR")}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-accent-soft">
              <span className=" text-muted-foreground">مهلت پرداخت</span>

              <span className="font-medium">
                {x.paymentDeadline.toLocaleDateString("fa-IR")}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-accent-soft-hover/30       ">
              <span className="text-sm text-muted-foreground">قیمت</span>

              <span className="font-medium">
                {x.price.toLocaleString("fa-IR")}
              </span>
            </div>

            <div
              className={cn(
                "w-full flex items-center justify-between text-center rounded-b-2xl px-4 py-2 text-xs",
                x.status === "paid" ? "bg-success" : "bg-danger"
              )}
            >
              <span className="text-sm text-muted-foreground">
                وضعیت فاکتور
              </span>

              <span className="font-medium">
                {x.status == "paid" ? "پرداخت شده" : "پرداخت نشده"}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
