import { Payments } from "@/app/data";
import { CheckCircle } from "@solar-icons/react-perf/category/ui/Outline/CheckCircle";
import { cn } from "tailwind-variants";

type TableProps = {
  payments: Payments;
};

export function Table({ payments }: TableProps) {
  return (
    <div className="w-full flex flex-col gap-4 rounded-xl overflow-hidden text-xs">
      <div className="w-full ">
        <div className="flex items-center justify-between py-2 px-4 bg-accent-soft-hover/30">
          <span className=" text-muted-foreground ">تاریخ ایجاد فاکتور</span>
          <span>{payments.factorCreated.toLocaleDateString("fa-IR")}</span>
        </div>
        <div className="flex items-center justify-between py-2 px-4 bg-accent-soft">
          <span className=" text-muted-foreground">{payments.title}</span>
          <span>{payments.volume.toLocaleString("fa-IR")}</span>
        </div>

        <div className="flex items-center justify-between p-2 px-4 bg-accent-soft-hover/30">
          <span className=" text-muted-foreground">قیمت</span>

          <span className="font-medium">
            {payments.price.toLocaleString("fa-IR")}
          </span>
        </div>
        <div className="flex items-center justify-between p-2 px-4 bg-accent-soft">
          <span className=" text-muted-foreground">مهلت پرداخت</span>

          <span className="font-medium">
            {payments.paymentDeadline.toLocaleDateString("fa-IR")}
          </span>
        </div>
        <div className="flex items-center justify-between p-2 px-4 bg-accent-soft-hover/30">
          <span className="text-sm text-muted-foreground">قیمت</span>

          <span className="font-medium">
            {payments.price.toLocaleString("fa-IR")}
          </span>
        </div>

        <div
          className={cn(
            "w-full flex items-center justify-between text-center rounded-b-2xl px-4 py-2 ",
            payments.status === "paid" ? "bg-success" : "bg-[#F77F00]",
          )}
        >
          <span className="text-xs text-muted-foreground">وضعیت فاکتور</span>
          {payments.status == "paid" ? (
            <CheckCircle size={24} className="*:stroke-1" />
          ) : (
            ""
          )}

          <span className="font-medium">
            {payments.status == "paid" ? "پرداخت شده" : "پرداخت نشده"}
          </span>
        </div>
      </div>
    </div>
  );
}
