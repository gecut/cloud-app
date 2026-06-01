import { Payments } from "@/routes/_app/data";
import { Server2 } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { GalleryWide } from "@solar-icons/react-perf/category/video/LineDuotone";
import { Tables } from "../table";
import { cn } from "tailwind-variants";

export interface InvoiceListProps {
  data: Payments[];
}

export function InvoiceList({ data }: InvoiceListProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      {data.map((payment) => {
        return <InvoiceCard data={payment} key={payment.title} />;
      })}
    </div>
  );
}

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
        className
      )}
    >
      <span className=" w-full flex items-center gap-1 justify-center">
        فاکتور شماره
        <span className="text-accent">
          {data.factorNumber.toLocaleString("fa-IR")}
        </span>
      </span>
      <div className="w-full flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex flex-col justify-center gap-2">
            <span className="leading-none">{data.title}</span>
            <span className="text-xs leading-none">{data.subTitle}</span>
          </div>
        </div>
        {data.type === "DOMAIN" ? (
          <GalleryWide size={48} />
        ) : (
          <Server2 size={48} />
        )}
      </div>

      <Tables data={[data]} />
    </div>
  );
}
