import { Payments } from "@/app/data";
import { formatJalaliDate } from "@gecut-cloud/contracts";
import { Chip } from "@heroui/react";
import { Server2 } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { GalleryWide } from "@solar-icons/react-perf/category/video/LineDuotone";

interface Transaction {
  data: Payments[];
}

export function Transactions({ data }: Transaction) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 rounded-[24px] bg-surface/50 border border-dashed border-border/40 text-center gap-3">
        <div className="p-4 rounded-2xl bg-primary/10 text-primary">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-bold text-sm text-foreground">هیچ تراکنشی ثبت نشده است</span>
          <span className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            تاریخچه تمامی پرداخت‌ها و تراکنش‌های آنلاین شما در این بخش ذخیره و نمایش داده می‌شود.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-2.5">
      {data.map((x, idx) => {
        return (
          <div key={x.id || x.factorNumber || idx} className="flex rounded-2xl bg-surface px-6 py-4 border border-border/40 shadow-xs">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-4">
                {x.type === "DOMAIN" ? (
                  <GalleryWide size={32} />
                ) : (
                  <Server2 size={32} />
                )}
                <div className="flex flex-col gap-1.5">
                  <span className="leading-none text-sm font-semibold text-foreground">
                    {x.title}
                  </span>

                  <span className="text-xs leading-none text-accent">
                    {x.subTitle}
                  </span>
                </div>
              </div>
              <div className="flex flex-col text-xs font-light gap-1 justify-end items-end">
                <Chip className="w-fit px-3 py-0.5 text-[11px] font-medium bg-success/15 text-success rounded-[8px]">
                  موفق
                </Chip>
                <span className="text-muted-foreground text-[11px]">
                  {formatJalaliDate(x.factorCreated)}
                </span>
                <span className="font-semibold text-foreground text-sm">
                  {(x.price || 0).toLocaleString("fa-IR")} تومــان
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
