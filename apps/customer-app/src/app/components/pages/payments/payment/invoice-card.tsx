import { Payments } from "@/app/data";
import { Server2 } from "@solar-icons/react-perf/category/devices/Bold";
import { GalleryWide } from "@solar-icons/react-perf/category/video/Bold";
import { cn } from "tailwind-variants";
import { Table } from "../table";
import { Button } from "@heroui/react/button";

export function InvoiceCard({
  data,
  className,
  onPay,
  isPaying = false,
}: {
  data: Payments;
  className?: string;
  onPay?: (invoice: Payments) => void;
  isPaying?: boolean;
}) {
  return (
    <div
      className={cn(
        "w-full flex flex-col gap-4 bg-surface p-6 rounded-2xl border border-border/40 shadow-xs",
        className,
      )}
    >
      <span className=" w-full flex items-center gap-1 justify-center">
        فاکتور شماره
        <span className="text-accent font-semibold">
          {typeof data.factorNumber === "number"
            ? data.factorNumber.toLocaleString("fa-IR")
            : data.factorNumber}
        </span>
      </span>
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col justify-center gap-2.5">
            <span className="leading-none font-medium">{data.title}</span>
            <span className="text-xs leading-none text-accent">{data.subTitle}</span>
          </div>
        </div>
        {data.type === "DOMAIN" ? (
          <GalleryWide size={48} />
        ) : (
          <Server2 size={48} />
        )}
      </div>

      <Table payments={data} />

      {data.status === "Awaiting payment" && (
        <Button
          variant="primary"
          className="w-full rounded-xl font-medium py-2.5 cursor-pointer shadow-xs transition-opacity"
          isDisabled={isPaying}
          onPress={() => onPay?.(data)}
        >
          {isPaying ? "در حال اتصال به درگاه و ثبت پرداخت..." : "پرداخت آنلاین"}
        </Button>
      )}

      {data.status === "cancelled" && (
        <div className="w-full text-center py-2.5 text-xs text-muted-foreground bg-muted/30 rounded-xl">
          این فاکتور لغو شده است
        </div>
      )}
    </div>
  );
}
