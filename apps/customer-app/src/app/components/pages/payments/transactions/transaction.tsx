import { Payments } from "@/routes/_app/data";
import { Chip } from "@heroui/react";
import { Server2 } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { GalleryWide } from "@solar-icons/react-perf/category/video/LineDuotone";

interface Transaction {
  data: Payments[];
}

export function Transactions({ data }: Transaction) {
  return (
    <div className="w-full flex flex-col gap-2">
      {data.map((x) => {
        return (
          <div className="flex rounded-2xl bg-surface px-6 py-4">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-4">
                {x.type === "DOMAIN" ? (
                  <GalleryWide size={32} />
                ) : (
                  <Server2 size={32} />
                )}
                <div className="flex flex-col gap-2">
                  <span className="leading-none text-md font-medium">
                    {x.title}
                  </span>

                  <span className="text-xs leading-none text-accent">
                    {x.subTitle}
                  </span>
                </div>
              </div>
              <div className="flex flex-col text-xs font-light gap-1 justify-end items-center">
                <Chip className="w-fit px-4 font-light bg-accent-soft rounded-[8px]">
                  {x.paymentDeadline.toLocaleDateString("fa-IR")}
                </Chip>
                {x.price.toLocaleString("fa-IR")}تومــان
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
