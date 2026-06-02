import { Payments } from "@/routes/_app/data";
import { Server2 } from "@solar-icons/react-perf/category/devices/Bold";
import { GalleryWide } from "@solar-icons/react-perf/category/video/Bold";
import { cn } from "tailwind-variants";
import { Table } from "../table";
import { Button } from "@heroui/react/button";

export function InvoiceCard({
  data,
  className,
}: {
  data: Payments;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full flex flex-col gap-4 bg-surface p-6 rounded-2xl",
        className,
      )}
    >
      <span className=" w-full flex items-center gap-1 justify-center">
        فاکتور شماره
        <span className="text-accent">
          {data.factorNumber.toLocaleString("fa-IR")}
        </span>
      </span>
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col justify-center gap-2.5">
            <span className="leading-none">{data.title}</span>
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

      {data.status !== "paid" && (
        <Button variant="primary" className="w-full rounded-md font-light py-1">
          پرداخت
        </Button>
      )}
    </div>
  );
}
