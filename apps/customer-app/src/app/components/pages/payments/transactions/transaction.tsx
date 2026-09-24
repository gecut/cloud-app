import { Payments } from "@/app/data";
import { formatJalaliDate } from "@gecut-cloud/contracts";
import { Chip } from "@heroui/react";
import { Server2 } from "@solar-icons/react-perf/category/devices/LineDuotone";
import { GalleryWide } from "@solar-icons/react-perf/category/video/LineDuotone";

interface TransactionProps {
  data: Payments[];
  onPay?: (invoice: Payments) => void;
  payingId?: string | null;
}

export function Transactions({ data, onPay, payingId }: TransactionProps) {
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
        const isPending = x.status === "Awaiting payment";

        return (
          <div
            key={x.id || x.factorNumber || idx}
            className={`flex flex-col rounded-2xl bg-surface p-4 sm:px-6 sm:py-4 border shadow-xs transition-colors gap-3 ${
              isPending ? "border-amber-500/30 bg-amber-500/[0.02]" : "border-border/40"
            }`}
          >
            <div className="flex flex-col sm:flex-row w-full items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="shrink-0 p-2 rounded-xl bg-accent-soft text-accent">
                  {x.type === "DOMAIN" ? (
                    <GalleryWide size={28} />
                  ) : (
                    <Server2 size={28} />
                  )}
                </div>
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {x.title}
                  </span>

                  <span className="text-xs text-accent truncate">
                    {x.subTitle}
                  </span>
                </div>
              </div>

              <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-end w-full sm:w-auto text-xs gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/20 shrink-0">
                <div className="flex items-center gap-2">
                  {isPending ? (
                    <>
                      <Chip className="w-fit px-2.5 py-0.5 text-[10px] font-medium bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-[8px] whitespace-nowrap">
                        معلق / در انتظار پرداخت
                      </Chip>
                      {onPay && (
                        <button
                          onClick={() => onPay(x)}
                          disabled={payingId === x.id}
                          className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer whitespace-nowrap"
                        >
                          {payingId === x.id ? "در حال اتصال..." : "پرداخت"}
                        </button>
                      )}
                    </>
                  ) : x.status === "cancelled" ? (
                    <Chip className="w-fit px-2.5 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded-[8px] whitespace-nowrap">
                      لغو شده
                    </Chip>
                  ) : (
                    <Chip className="w-fit px-2.5 py-0.5 text-[10px] font-medium bg-success/15 text-success rounded-[8px] whitespace-nowrap">
                      موفق
                    </Chip>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                  <span className="text-muted-foreground text-[11px] font-mono whitespace-nowrap">
                    {formatJalaliDate(x.factorCreated)}
                  </span>
                  <span
                    className={`font-semibold text-sm whitespace-nowrap ${
                      isPending ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                    }`}
                  >
                    {(x.price || 0).toLocaleString("fa-IR")} تومــان
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
