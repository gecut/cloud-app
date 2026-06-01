import { Payments } from "@/routes/_app/data";
import { Server2 } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { GalleryWide } from "@solar-icons/react-perf/category/video/LineDuotone";
import { Tables } from "../table";

interface PaymentsProps {
  data: Payments[];
}

export function PaymentDetails({ data }: PaymentsProps) {
  return (
    <div className="w-full flex flex-col gap-2">
      {data.map((x) => {
        return (
          <div className="w-full flex flex-col gap-4 bg-surface p-6 rounded-2xl">
            <span className=" w-full flex items-center gap-1 justify-center">
              فاکتور شماره
              <span className="text-accent">
                {x.factorNumber.toLocaleString("fa-IR")}
              </span>
            </span>
            <div className="w-full flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex flex-col justify-center gap-2">
                  <span className="leading-none">{x.title}</span>
                  <span className="text-xs leading-none">{x.subTitle}</span>
                </div>
              </div>
              {x.type === "DOMAIN" ? (
                <GalleryWide size={48} />
              ) : (
                <Server2 size={48} />
              )}
            </div>
            <Tables data={[x]} />
          </div>
        );
      })}
    </div>
  );
}
