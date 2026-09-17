import { Payments } from "@/app/data";
import { InvoiceCard } from "./invoice-card";

export interface InvoiceListProps {
  data: Payments[];
  onPay?: (invoice: Payments) => void;
  payingId?: string | null;
  onCancel?: (invoice: Payments) => void;
  cancellingId?: string | null;
  onReactivate?: (invoice: Payments) => void;
  reactivatingId?: string | null;
}

export function InvoiceList({
  data,
  onPay,
  payingId,
  onCancel,
  cancellingId,
  onReactivate,
  reactivatingId,
}: InvoiceListProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-12 rounded-[24px] bg-surface/50 border border-dashed border-border/40 text-center gap-3">
        <div className="p-4 rounded-2xl bg-primary/10 text-primary">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-bold text-sm text-foreground">هیچ فاکتوری برای شما صادر نشده است</span>
          <span className="text-xs text-muted-foreground max-w-xs leading-relaxed">
            فاکتورهای تمدید و دوره‌ای خدمات شما پس از صدور توسط سیستم مالی، در این بخش قابل مشاهده و پرداخت خواهند بود.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-3">
      {data.map((payment) => {
        return (
          <InvoiceCard
            data={payment}
            key={payment.id || `${payment.title}-${payment.factorNumber}`}
            onPay={onPay}
            isPaying={payingId === payment.id}
            onCancel={onCancel}
            isCancelling={cancellingId === payment.id}
            onReactivate={onReactivate}
            isReactivating={reactivatingId === payment.id}
          />
        );
      })}
    </div>
  );
}
